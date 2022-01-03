const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const { logRequests } = require('./middlewares/logger');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logRequests);

const shortUrls = [];
const successResObj = (originalUrl, shortUrl) => ({ original_url: originalUrl, short_url: shortUrl });
const invalidResObj = { error: "invalid url" };
const urlRegEx = /^((?:(https?):\/\/)?((?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9][0-9]|[0-9])\.(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9][0-9]|[0-9])\.)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9][0-9]|[0-9])\.)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9][0-9]|[0-9]))|(?:(?:(?:\w+\.){1,2}[\w]{2,3})))(?::(\d+))?((?:\/[\w]+)*)(?:\/|(\/[\w]+\.[\w]{3,4})|(\?(?:([\w]+=[\w]+)&)*([\w]+=[\w]+))?|\?(?:(wsdl|wadl))))$/g;

function handleInvalidUrl(req, res, next) {
    const url = req.body["url"];
    req.isInvalid = false;

    if (urlRegEx.test(url) === false) {
        req.isInvalid = true;
    }

    next();
}

function handleShortUrl(req, res, next) {
    const url = req.body["url"];

    if (req.isInvalid) {
        res.json(invalidResObj);
    } else {
        shortUrls.push(url);
        res.json(successResObj(url, shortUrls.length));
    }
}

function handleRedirect(req, res, next) {
    const shortUrl = req.params.short_url;

    if (shortUrl === undefined || shortUrl > shortUrls.length) {
        res.json(invalidResObj)
    } else {
        res.redirect(shortUrls[shortUrl - 1]);
    }
}

app.route("/api/shorturl")
    .post([handleInvalidUrl, handleShortUrl]);

app.route("/api/shorturl/:short_url")
    .get(handleRedirect);

module.exports = app;