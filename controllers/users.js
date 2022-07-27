const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');
const ConflictingRequestError = require('../errors/conflicting-request-err');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.getMe = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь не найден');
      }
      res.send(user);
    })
    .catch(next);
};

module.exports.updateProfile = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, {
    new: true,
    runValidators: true,
    upsert: false,
  })
    .orFail(() => {
      throw new NotFoundError('Пользователь c данным ID не существует');
    })
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
        return;
      }
      next(err);
    });
};

module.exports.createUser = (req, res, next) => {
  const { name, email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        throw new ConflictingRequestError('Пользователь с таким e-mail уже существует');
      }
      bcrypt.hash(password, 10)
        .then((hash) => User.create({
          name,
          email,
          password: hash,
        }))
        .then((newUser) => res.send({
          name: newUser.name,
          email: newUser.email,
        }))
        .catch((err) => {
          if (err.name === 'ValidationError') {
            next(new BadRequestError('Переданы некорректные данные'));
            return;
          }
          next(err);
        });
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'super-strong-secret', { expiresIn: '7d' });
      res.cookie('jwt', token, {
        maxAge: 3600000 * 24 * 7,
        httpOnly: true,
      });
      res.send({ token });
    })
    .catch(next);
};

module.exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.send({ message: 'OK' });
};
