// Worker related tasks

const _data = require('./data');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

const workers = {};




workers.init = () => {
    console.log('workers starting');
};

module.exports = workers;