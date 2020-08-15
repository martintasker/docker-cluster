const express = require('express');
/* eslint-disable no-console */

const HOST = '0.0.0.0';
const PORT = 1401;

const app = express();

app.get('/',
  (req, res) => {
    res.send(`Hello from ${HOST}:${PORT}\n`);
    console.log(`${req.url} -> ${res.statusCode}`);
  }
);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
// so there
