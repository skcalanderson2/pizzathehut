// Worker related tasks

const _data = require('./data');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

const workers = {};


workers.gatherAllChecks = () => {
    // Get all the checks
    _data.list('checks', (err, checks) => {
        if(!err && checks && checks.length > 0) {
            checks.map(check => {
                _data.read('checks', check, (err, originalCheckData) => {
                    if(!err && originalCheckData){
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log(`Error reading ${check}'s data` );
                    }
                });
            })
        } else {
            console.log('Error: Could not find any checks to process');
        }
    });
};

workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof(originalCheckData) == 'object' 
        && originalCheckData !== null 
        ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' 
        && originalCheckData.id.trim().length == 20 
        ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' 
        && originalCheckData.userPhone.trim().length == 10 
        ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' 
        && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 
        ? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' 
        && originalCheckData.url.trim().length > 0 
        ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' 
        && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 
        ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' 
        && originalCheckData.successCodes instanceof Array 
        && originalCheckData.successCodes.length > 0
        ? originalCheckData.successCodes : [];
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' 
        && originalCheckData.timeoutSeconds % 1 == 0 
        && originalCheckData.timeoutSeconds >= 1
        && originalCheckData.timeoutSeconds <= 5
        ? originalCheckData.timeoutSeconds : false;
    
    originalCheckData.state = originalCheckData.state = typeof(originalCheckData.state) == 'string' 
        && ['up', 'down'].indexOf(originalCheckData.state) > -1 
        ? originalCheckData.state : false;

    originalCheckData.lastChecked = originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' 
        && originalCheckData.timeoutSeconds > 0
        ? originalCheckData.timeoutSeconds : false;

    if(originalCheckData.id 
        && originalCheckData.userPhone
        && originalCheckData.protocol
        && originalCheckData.url
        && originalCheckData.method
        && originalCheckData.successCodes
        && originalCheckData.timeoutSeconds){
            workers.performCheck(originalCheckData);
        } else {
            console.log("Error: One of the checks it not properly formatted");
        }
}

workers.performCheck = (originalCheckData) => {
    let checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    let outcomeSent = false;

    const parsedURL = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);

    const hostName = parsedURL.hostname;
    const path = parsedURL.path; // using path and not pathname because we want the querystring

    const requestDetails = {
        'protocol' : originalCheckData.protocol + ':',
        'hostname' : hostName,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000
    };

    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, (res) => {
        const status = res.statusCode;
        checkOutcome.responseCode = status;
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', (_) => {
        checkOutcome.error = {
            'error' : true,
            'value' : 'timeout'
        };
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
}


workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if(!err){
            if(alertWarranted){
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert needed');
            }
        } else {
            console.log("Error trying to save updates to one of the checks");
        }
    });
};

workers.alertUserToStatusChange = (newCheckData) => {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        if(!err){
            console.log(`Success: User was alerted to a status change in their check via SMS Msg ${msg}`);
        } else {
            console.log(`Error: Could not send sms alert to the user who had a state change in their check, ${err}`);
        }

    });
};

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.init = () => {

    workers.gatherAllChecks();

    workers.loop();
};

module.exports = workers;