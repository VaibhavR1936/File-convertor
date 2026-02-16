// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const filesRouter = require('./routes/files');
const mediaConvertRouter = require('./routes/mediaConvert'); // NEW

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/fileconverter';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Mongo connected'))
    .catch(e => console.error('Mongo err', e));

app.use('/api/files', filesRouter);
app.use('/api/convert', mediaConvertRouter); // NEW

app.use('/static/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/static/converted', express.static(path.join(__dirname, 'converted')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server running on', PORT));
