const express = require('express');
const volleyball = require('volleyball');
const laureate = require('./laureate');

const app = express();


app.use(volleyball);

app.use('/api/laureate', laureate);

module.exports = app;
