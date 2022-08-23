require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { errors } = require('celebrate');
const cors = require('cors');
// const cors = require('./middlewares/cors');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const router = require('./routes/index');
const errorHandler = require('./middlewares/error-handler');
const limiter = require('./middlewares/limiter');

const { PORT = 3001, NODE_ENV, DATABASE_URL } = process.env;
const app = express();

app.use(cors({
  origin: ['https://prdiploma.nomoredomains.xyz', 'http://prdiploma.nomoredomains.xyz', 'http://localhost:3000', 'http://localhost:3001'],
  allowedHeaders: ['Access-Control-Allow-Credentials', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers', 'Authorization', 'Content-Type'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
}));

// app.use(cors);

mongoose.connect(`${NODE_ENV === 'production' ? DATABASE_URL : 'mongodb://localhost:27017/bitfilmsdb'}`);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestLogger);

app.use(limiter);
app.use(helmet());
app.use('/', router);
app.use(errorLogger);
app.use(errors());

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
