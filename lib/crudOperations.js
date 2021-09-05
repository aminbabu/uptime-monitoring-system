/*
 * Title: lib operations library
 * Description: Library that handles file create, read, update & delete operations
 * Author: Amin Babu
 * Date: 08/13/2021
 */

// dependencies
const fs = require('fs');
const path = require('path');

// lib object - module scaffolding
const lib = {};

// define base file path
lib.basedir = path.join(__dirname, '../.data');

// function to create requested user data to database
lib.createFile = (dir, fileName, userData, callback) => {
    // define directory path
    const directory = `${lib.basedir}/${dir}`;
    // define file path
    const filePath = `${directory}/${fileName}.json`;

    // create a new directory if it does not exist
    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
    } catch (err) {
        console.error(err);
    }

    // open file to create requested file
    fs.open(filePath, 'wx', (err1, descriptor) => {
        if (!err1 && descriptor) {
            // stringify the user data
            const stringifiedData = JSON.stringify(userData);

            // write data to the database
            fs.writeFile(descriptor, stringifiedData, (err2) => {
                if (!err2) {
                    // close file properly
                    fs.close(descriptor, (err3) => {
                        if (!err3) {
                            callback(false);
                        } else {
                            callback('Err! Server side.');
                        }
                    });
                } else {
                    console.log(err2);
                }
            });
        } else {
            callback('Could not create file, it may already exists!');
        }
    });
};

// function to read requested user data from database
lib.readFile = (dir, fileName, callback) => {
    // define file path
    const filePath = `${lib.basedir}/${dir}/${fileName}.json`;

    // read data from
    fs.readFile(filePath, 'utf-8', (err, userData) => {
        callback(err, userData);
    });
};

// function to update requested user data to database
lib.updateFile = (dir, fileName, userData, callback) => {
    // define file path
    const filePath = `${lib.basedir}/${dir}/${fileName}.json`;

    // open file to read data
    fs.open(filePath, 'r+', (err1, descriptor) => {
        if (!err1 && descriptor) {
            // truncate data from requested file
            fs.ftruncate(descriptor, (err2) => {
                if (!err2) {
                    // stringify the user data
                    const stringifiedData = JSON.stringify(userData);

                    // update data to the database
                    fs.writeFile(descriptor, stringifiedData, (err3) => {
                        if (!err3) {
                            // close file properly
                            fs.close(descriptor, (err4) => {
                                if (!err4) {
                                    callback(false);
                                } else {
                                    callback('ERR! file could not close properly.');
                                }
                            });
                        } else {
                            callback('ERR! could not update requested data.');
                        }
                    });
                } else {
                    callback('ERR! could not truncate file.');
                }
            });
        } else {
            callback('Could not update data! File may not exists.');
        }
    });
};

// function to delete requested user data from database
lib.deleteFile = (dir, fileName, callback) => {
    // define file path
    const filePath = `${lib.basedir}/${dir}/${fileName}.json`;

    // delete requested file
    fs.unlink(filePath, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('ERR! could not delete user requested data.');
        }
    });
};

// function to collect all the files
lib.listFiles = (dir, callback) => {
    // define directory path
    const dirPath = `${lib.basedir}/${dir}/`;

    fs.readdir(dirPath, (err1, files) => {
        if (!err1 && files) {
            const trimmedFileNames = [];

            files.forEach((file) => {
                trimmedFileNames.push(file.replace('.json', ''));
            });

            callback(false, trimmedFileNames);
        } else {
            callback('ERR! Could not find any file in the directory.');
        }
    });
};
// export lib object
module.exports = lib;
