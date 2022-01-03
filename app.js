const express = require('express');
const bodyParser = require('body-parser');
const { logRequests } = require('./middlewares/logger');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logRequests);

const shortUrls = [];
const successResObj = (originalUrl, shortUrl) => ({ original_url: originalUrl, short_url: shortUrl });
const invalidResObj = { error: "invalid url" };
const protocolRegex = /^(http:|https:|ftp:)/gi;
const protocolLookup = {
    "http:": /^(http:\/\/)/gi,
    "https:": /^(https:\/\/)/gi,
    "ftp:": /^(ftp:\/\/)/gi
}

function handleInvalidUrl(req, res, next) {
    const url = req.body["url"];
    req.isInvalid = false;

    if (url === '') {
        req.isInvalid = true;
    }

    const protocolMatches = url.match(protocolRegex);

    if (protocolMatches.length && url.match(protocolLookup[protocolMatches[0]]) == null) {
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