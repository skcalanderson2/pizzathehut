// Server related tasks

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

const server = {};


// helpers.sendTwilioSms('4158375309', 'Hello!', (err) => {
//   console.log(err);
// })

 // Instatiating http server
server.httpServer = http.createServer(function(req,res){
    server.unifiedServer(req,res);
    });

server.httpsServerOptions = {
  'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')), 
  'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

 // Instatiating https server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req,res){
  server.unifiedServer(req,res);
});


// All the server logic for both http and https servers
server.unifiedServer = function(req, res){
  
  // Parse the url
  var parsedUrl = url.parse(req.url, true);
  
  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
  // Get the query string as an object
  var queryStringObject = parsedUrl.query;
  
  // Get the HTTP method
  var method = req.method.toLowerCase();
  
  //Get the headers as an object
  var headers = req.headers;
  
  // Get the payload,if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
      buffer += decoder.write(data);
  });
  req.on('end', function() {
      buffer += decoder.end();
  
      // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
      var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
  
      // Construct the data object to send to the handler
      var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
      };
  
      // Route the request to the handler specified in the router
      chosenHandler(data,function(statusCode,payload){
  
        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
  
        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof(payload) == 'object'? payload : {};
  
        // Convert the payload to a string
        var payloadString = JSON.stringify(payload);
  
        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log("Returning this response: ",statusCode,payloadString);
  
      });
  
  });
  
};

// Define the request router
server.router = {
  'ping' : handlers.ping,
  'users' : handlers.users,
  'tokens' : handlers.tokens,
  'checks' : handlers.checks
};


server.init = () => {
    // Start http server
    server.httpServer.listen(config.httpPort, function(){
        console.log(`The server is up and running now on port ${config.httpPort}`);
    });  

    // Start https server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log(`The server is up and running now on port ${config.httpsPort}`);
    });
}

module.exports = server;