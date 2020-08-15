const express = require('express');

const HOST = '0.0.0.0';
const PORT = 1403;

const app = express();

app.use(require('./src/routes'));

app.listen(PORT, HOST);
/* eslint-disable-next-line no-console */
console.log(`Running on http://${HOST}:${PORT}`);
