/*
 * Title: Check routes
 * Description: Handles all the things related to user check route
 * Author: Amin Babu
 * Date: 09/02/2021
 */

// dependencies
const lib = require('../../lib/crudOperations');
const { parseJSON, createRandomStr } = require('../../lib/utilities');
const tokenHanlder = require('./userTokenRoute');
const { tokenLen, checkLen } = require('../../helpers/environments');

// handler object - module scaffolding
const handler = {};

// function to handle check route
handler.userCheckRoute = (requestedProps, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    const method = requestedProps.method.toLowerCase();

    // verify user requested method
    if (acceptedMethods.indexOf(method) > -1) {
        // define the right operation
        handler._check[method](requestedProps, callback);
    } else {
        callback(405, {
            error: 'Operation is not allowed!',
        });
    }
};

// _check object - module scaffolding
handler._check = {};

// function to create a new check
handler._check.post = (requestedProps, callback) => {
    // regular expression to validate url
    const regex = /([A-z]+)\.([A-z]{2,})/;

    // user requested data validation
    const protocol =
        typeof requestedProps.body.protocol === 'string' &&
        ['http', 'https'].indexOf(requestedProps.body.protocol.toLowerCase()) > -1
            ? requestedProps.body.protocol
            : false;

    const url =
        typeof requestedProps.body.url === 'string' &&
        requestedProps.body.url.trim().length > 0 &&
        regex.test(requestedProps.body.url.trim())
            ? requestedProps.body.url.trim()
            : false;

    const method =
        typeof requestedProps.body.method === 'string' &&
        ['get', 'post', 'put', 'delete'].indexOf(requestedProps.body.method.toLowerCase()) > -1
            ? requestedProps.body.method
            : false;

    const successCodes =
        typeof requestedProps.body.successCodes === 'object' &&
        requestedProps.body.successCodes instanceof Array
            ? requestedProps.body.successCodes
            : [];

    const timeoutSeconds =
        typeof requestedProps.body.timeoutSeconds === 'number' &&
        requestedProps.body.timeoutSeconds >= 1 &&
        requestedProps.body.timeoutSeconds <= 5
            ? requestedProps.body.timeoutSeconds
            : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // token validation
        const token =
            typeof requestedProps.headers.token === 'string' &&
            requestedProps.headers.token.trim().length === tokenLen
                ? requestedProps.headers.token.trim()
                : false;

        // lookup the token requested user
        lib.readFile('tokens', token, (err1, tokenData) => {
            if (!err1 && tokenData) {
                // turn token data into valid JS object
                const tokenObject = { ...parseJSON(tokenData) };
                const { phone } = tokenObject;

                // verify the requested token
                tokenHanlder._token.verify(token, phone, (isTokenValid) => {
                    if (isTokenValid) {
                        // lookup the user
                        lib.readFile('users', phone, (err2, userData) => {
                            if (!err2 && userData) {
                                // turn user data into valid JS Object
                                const userObject = { ...parseJSON(userData) };
                                const userChecks =
                                    typeof userObject.checks === 'object' &&
                                    userObject.checks instanceof Array
                                        ? userObject.checks
                                        : [];

                                if (userChecks.length < 5) {
                                    // construct check object
                                    const checkID = createRandomStr(checkLen);
                                    const checkObject = {
                                        id: checkID,
                                        phone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds,
                                    };

                                    // store check to database
                                    lib.createFile('checks', checkID, checkObject, (err3) => {
                                        if (!err3) {
                                            // add check instance to user database
                                            userChecks.push(checkID);
                                            userObject.checks = userChecks;

                                            // update user database
                                            lib.updateFile('users', phone, userObject, (err4) => {
                                                if (!err4) {
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, {
                                                        error: 'ERR! Internal server problem. Could not update user check data.',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                error: 'ERR! Internal server problem. Check may already exist.',
                                            });
                                        }
                                    });
                                } else {
                                    callback(406, {
                                        error: 'Request not acceptable! User checks may already reach max limit',
                                    });
                                }
                            } else {
                                callback(500, {
                                    error: 'ERR! Internal server problem. Corresponding user was not found.',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'Authentication failure! Token may already expired.',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Requested token is not valid!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to read user requested check data
handler._check.get = (requestedProps, callback) => {
    // user requested data validation
    const checkID =
        typeof requestedProps.queries.get('id') === 'string' &&
        requestedProps.queries.get('id').trim().length === checkLen
            ? requestedProps.queries.get('id').trim()
            : false;

    if (checkID) {
        // token validation
        const token =
            typeof requestedProps.headers.token === 'string' &&
            requestedProps.headers.token.trim().length === tokenLen
                ? requestedProps.headers.token.trim()
                : false;

        // lookup the requested user check
        lib.readFile('checks', checkID, (err1, checkData) => {
            if (!err1 && checkData) {
                // turn check data into valid JS object
                const checkObject = { ...parseJSON(checkData) };
                const { phone } = checkObject;

                // vefiry the requested token
                tokenHanlder._token.verify(token, phone, (isTokenValid) => {
                    if (isTokenValid) {
                        callback(200, checkObject);
                    } else {
                        callback(403, {
                            error: 'Authentication failure!',
                        });
                    }
                });
            } else {
                callback(404, {
                    error: 'Requested user check was not found!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to update user requested check data
handler._check.put = (requestedProps, callback) => {
    // regular expression to validate url
    const regex = /([A-z]+)\.([A-z]{2,})/;

    // user requested data validation
    const protocol =
        typeof requestedProps.body.protocol === 'string' &&
        ['http', 'https'].indexOf(requestedProps.body.protocol.toLowerCase()) > -1
            ? requestedProps.body.protocol
            : false;

    const url =
        typeof requestedProps.body.url === 'string' &&
        requestedProps.body.url.trim().length > 0 &&
        regex.test(requestedProps.body.url.trim())
            ? requestedProps.body.url.trim()
            : false;

    const method =
        typeof requestedProps.body.method === 'string' &&
        ['get', 'post', 'put', 'delete'].indexOf(requestedProps.body.method.toLowerCase()) > -1
            ? requestedProps.body.method
            : false;

    const successCodes =
        typeof requestedProps.body.successCodes === 'object' &&
        requestedProps.body.successCodes instanceof Array
            ? requestedProps.body.successCodes
            : [];

    const timeoutSeconds =
        typeof requestedProps.body.timeoutSeconds === 'number' &&
        requestedProps.body.timeoutSeconds >= 1 &&
        requestedProps.body.timeoutSeconds <= 5
            ? requestedProps.body.timeoutSeconds
            : false;

    const checkID =
        typeof requestedProps.body.id === 'string' &&
        requestedProps.body.id.trim().length === checkLen
            ? requestedProps.body.id.trim()
            : false;

    if (checkID) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            // token validation
            const token =
                typeof requestedProps.headers.token === 'string' &&
                requestedProps.headers.token.trim().length === tokenLen
                    ? requestedProps.headers.token
                    : false;

            // lookup the user check data
            lib.readFile('checks', checkID, (err1, checkData) => {
                if (!err1) {
                    // turn check data into valid JS object
                    const checkObject = { ...parseJSON(checkData) };
                    const { phone } = checkObject;

                    // verify the user requested token
                    tokenHanlder._token.verify(token, phone, (isTokenValid) => {
                        if (isTokenValid) {
                            if (protocol) checkObject.protocol = protocol;
                            if (url) checkObject.url = url;
                            if (method) checkObject.method = method;
                            if (successCodes) checkObject.successCodes = successCodes;
                            if (timeoutSeconds) checkObject.timeoutSeconds = timeoutSeconds;

                            // update check data
                            lib.updateFile('checks', checkID, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200, checkObject);
                                } else {
                                    callback(500, {
                                        error: 'ERR! Internal server problem.',
                                    });
                                }
                            });
                        } else {
                            callback(403, {
                                error: 'Authentication failure!',
                            });
                        }
                    });
                } else {
                    callback(404, {
                        error: 'Invalid check data! Requested user check may not exist.',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'Invaild request! You should provide at least one field to update.',
            });
        }
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to delete user requested check data
handler._check.delete = (requestedProps, callback) => {
    // user requested data validation
    const checkID =
        typeof requestedProps.queries.get('id') === 'string' &&
        requestedProps.queries.get('id').trim().length === checkLen
            ? requestedProps.queries.get('id').trim()
            : false;

    if (checkID) {
        // token validation
        const token =
            typeof requestedProps.headers.token === 'string' &&
            requestedProps.headers.token.trim().length === tokenLen
                ? requestedProps.headers.token.trim()
                : false;

        // lookup the requested user check
        lib.readFile('checks', checkID, (err1, checkData) => {
            if (!err1 && checkData) {
                // turn check data into valid JS object
                const checkObject = { ...parseJSON(checkData) };
                const { phone } = checkObject;

                // vefiry the requested token
                tokenHanlder._token.verify(token, phone, (isTokenValid) => {
                    if (isTokenValid) {
                        // delete the user requested check data
                        lib.deleteFile('checks', checkID, (err2) => {
                            if (!err2) {
                                // delete check instance from user databse
                                lib.readFile('users', phone, (err3, userData) => {
                                    if (!err3 && userData) {
                                        const userObject = { ...parseJSON(userData) };
                                        const userChecks = userObject.checks;
                                        const indexOfUserCheck = userChecks.indexOf(checkID);

                                        if (indexOfUserCheck > -1) {
                                            userChecks.splice(indexOfUserCheck, 1);
                                            userObject.checks = userChecks;

                                            // update user data
                                            lib.updateFile('users', phone, userObject, (err4) => {
                                                if (!err4) {
                                                    callback(200, {
                                                        message:
                                                            'Requested user data succesfully updated!',
                                                    });
                                                } else {
                                                    callback(500, {
                                                        error: 'ERR! Could not update user requested data.',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                error: 'ERR! Could not remove any checks from user data.',
                                            });
                                        }
                                    } else {
                                        callback(500, {
                                            error: 'ERR! Internal server problem. User may not exist.',
                                        });
                                    }
                                });
                            } else {
                                callback(500, {
                                    error: 'ERR! Internal server problem. User checks may not exist.',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'Authentication failure!',
                        });
                    }
                });
            } else {
                callback(404, {
                    error: 'Requested user check was not found!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// export handler object
module.exports = handler;
