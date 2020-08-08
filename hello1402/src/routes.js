const express = require('express');
/* eslint-disable no-console */

const router = express.Router();

router.get('/', (req, res) => {
    res.send(`Hello!\n`);
    console.log(`${req.url} -> ${res.statusCode}`);
});

module.exports = router;
