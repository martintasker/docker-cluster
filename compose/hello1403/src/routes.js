const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.get('/', async(req, res) => {
  const rawData = await fetch('http://hello1402:1402');
  const text = (await rawData.text()).replace('\n', '');
  res.send(`From 1402 via 1403: ${text}\n`);
  /* eslint-disable-next-line no-console */
  console.log(`${req.url} -> ${res.statusCode}`);
});

module.exports = router;
