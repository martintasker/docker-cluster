const express = require('express');
const fetch = require('node-fetch');
/* eslint-disable no-console */

const HOST = '0.0.0.0';
const PORT = 1403;

const app = express();

app.get('/',
  async (req, res) => {
    const rawData = await fetch('http://hello1402:1402');
    const text = (await rawData.text()).replace('\n', '');
    res.send(`From ${HOST}:${PORT}: ${text}\n`);
    console.log(`${req.url} -> ${res.statusCode}`);
  }
);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
