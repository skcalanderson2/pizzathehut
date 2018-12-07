// Create and export configuration variables

var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'this is a secret',
    'maxChecks' : 5,
    'twilio' : {
        'AccountSID' : 'AC57531fd5d1d2e892db6643b9ed9e64cd',
        'AuthToken' : '9aba9cea4ed7e6d317c2dd76010d2409',
        'fromPhone' : '+15005550006'
    }   
};

environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'this is a secret',
    'maxChecks' : 5,
    'twilio' : {
        'AccountSID' : 'AC57531fd5d1d2e892db6643b9ed9e64cd',
        'AuthToken' : '9aba9cea4ed7e6d317c2dd76010d2409',
        'fromPhone' : '+15005550006'
    }   
};

// Determine which environment was passed as a command line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the above.

var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;