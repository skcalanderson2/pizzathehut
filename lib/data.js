// Library for storing and editing data

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = (dir, file, data, callback) => {
    // try to open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err,fileDescriptor) => {
        if(!err && fileDescriptor) {
           writeFile(fileDescriptor, data, callback); 
        } else {
            callback('Could not create new file, it may already exist');
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) =>{
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        };
    });
};

lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err,fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.ftruncate(fileDescriptor, (err) => {
                if(!err) {
                    writeFile(fileDescriptor, data, callback);
                } else {
                callback('error truncating file');
            }
        });
    } else {
        callback('Could not open file, does not exist');
    }
});
};

const writeFile = (fileDescriptor, data, callback) => {
    var stringData = JSON.stringify(data);
    fs.writeFile(fileDescriptor, stringData, (err) => {
        if(!err){
             fs.close(fileDescriptor, (err) => {
                 if(!err){
                     callback(false);
                 } else {
                     callback('error closing file');
                 }
             });
        } else {
            callback("error writing to file");
        }
    }); 

};

lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if(!err) {
            callback(false);
        } else {
            callback('error deleting file');
        }
    });
};

lib.list = (dir, callback) => {
    fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
        if(!err && data && data.length > 0) {
            const trimmedFileNames = data.map(fileName => fileName.replace('.json', ''));
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
}

module.exports = lib;

