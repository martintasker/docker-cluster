const express = require('express');
/* eslint-disable no-console */

const PORT = process.env.PORT || 1401;
const HOSTNAME = process.env.HOSTNAME;

const app = express();

app.get('/',
  (req, res) => {
    res.send(`Hello from ${HOSTNAME}:${PORT}\n`);
    console.log(`${req.url} -> ${res.statusCode}`);
  }
);

app.listen(PORT);
console.log(`Running on http://${HOSTNAME}:${PORT}`);
