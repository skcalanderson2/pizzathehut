// Library for storing and rotating log files

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

lib.append = (fileName, str, callback) => {
    fs.open(lib.baseDir+fileName+'.log', 'a', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.appendFile(fileDescriptor, str+'\n', (err) => {
                if(!err){
                    fs.close(fileDescriptor, (err) => {
                        if(!err){
                            callback(false);
                        } else {
                            callback('Error closing file');
                        }
                    })
                } else {
                    callback('Error appending to file');
                }
            })
        } else {
            callback('Could not open file for appending');
        }
    });
};

lib.asyncAppend = async (fileName, str)  => {
    return new Promise((resolve, reject) => {
        fs.appendFile(lib.baseDir+fileName+'.log', str+'\n', (err) => {
            if(err){
                reject('Error appending to file');
            } else {
                resolve('Log file appended to');
            }
        });
    });
};

lib.list = async (includeCompressedLogs) => {
    return new Promise((resolve, reject) => {
        fs.readdir(lib.baseDir, (err, data) => {
            if(err){
                reject(err, data);
            } else {
                const trimmedFilenames = data.map(fileName => {
                    if(fileName.indexOf('.log') > -1){
                        fileName.replace('.log', '');
                    } else if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                        fileName.replace('.gz.b64', '');
                    } else fileName = '';
                    return fileName;
                }).filter(fileName => fileName !== '');
                resolve(trimmedFilenames);
            }
        });  
    });
};

lib.compress = async (logId, newFileId) => {
    return new Promise((resolve, reject) => {
        const sourceFile = logId + '.log';
        const destinationFile = newFileId + '.gz.b64';

        fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, inputString) => {
            if(err){
                reject(err, inputString);
            } else {
                zlib.gzip(inputString, (err, buffer) => {
                    if(err){
                        reject(err, buffer);
                    } else {
                        fs.writeFile(lib.baseDir + destinationFile, buffer.toString('base64'), (err) => {
                            if(err){
                                reject(err);
                            } else {
                                resolve('Log file compressed');
                            }
                        })
                    }
                });
            }
        });
    });
};

lib.decompress = async (fileId) => {
  return new Promise((resolve, reject) => {
    const fileName = fileId + '.gz.b64';
    OscillatorNode.readFile(lib.baseDir + fileName, 'utf8', (err, str) => {
        if(err){
            reject(err);
        } else {
            const inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if(err){
                    reject(err);
                } else {
                    const str = outputBuffer.toString();
                    resolve(str);
                }

            });
        }
    });
  });
};

lib.truncate = async(logId) => {
    return new Promise((resolve, reject) => {
        fs.truncate(lib.baseDir + logId + '.log', 0, (err) => {
            if(err){
                reject(err);
            } else {
                resolve('log file truncated');
            }

        });
    });
}

module.exports = lib;






    // lib.asyncAppend = async function (fileName, str, callback) {
    //     return new Promise((resolve, reject) => {
    //         fs.open(lib.baseDir+fileName+'.log', 'a', (err, fileDescriptor) => {
    //             if(err) {
    //                 reject('Could not open file for appending');
    //             } else {
    //                     fs.appendFile(fileDescriptor, str+'\n', (err) => {
    //                         if(err){
    //                             reject('Error appending to file');
    //                         } else {
    //                             fs.close(fileDescriptor, (err) => {
    //                                 if(err){
    //                                     reject('Error closing file');
    //                                 } else {
    //                                     resolve('Log file appended to');
    //                                 }
    //                             })
    //                         }
    //                     })
    //             }
    //         });
    //     })
    // };