const express = require('express');
/* eslint-disable no-console */

const HOST = '0.0.0.0';
const PORT = 1402;

const app = express();

app.use(require('./src/routes'));

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
