const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');


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


helpers.sendTwilioSms = (phone, msg, callback) => {
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if(phone && msg){
        // Configure payload to send to Twilio
        // Send a post payload to Twilio with certain headers
        const payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1' + phone,
            'Body' : msg
        };

        // Stringify payload
        const stringPayload = querystring.stringify(payload);

        // Configure request details
        const requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : `/2010-04-01/Accounts/${config.twilio.AccountSID}/Messages.json`,
            'auth' : config.twilio.AccountSID + ':' + config.twilio.AuthToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate request and fire it off
        const req = https.request(requestDetails, (res) => {
            // Grab status of sent request
            const status = res.statusCode;
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback(`Status code returned was ${status}`);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', (e) => {
            callback(e);
        });

        req.write(stringPayload);

        // End request (send it off)
        req.end();
        
    } else {
        callback('Given Parameters are missing or invalid');
    }
};



module.exports = helpers;