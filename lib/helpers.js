const crypto = require('crypto');
const config = require('./config');


const helpers = {};

helpers.hash = (string) => {
    if(typeof(string)=='string' && string.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonToObject = (buffer) => {
    try{
        const obj = JSON.parse(buffer);
        return obj;
    } catch(e) {
        return {};
    };
};

helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.apply(null, Array(strLength)) // Creates an array of length strLength with undefines
            .map(_ => {return possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))}) // maps the function across the array to fill it with random characters
            .join(''); // change array to string
    } else {
        return false;
    };
};

module.exports = helpers;