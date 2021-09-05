/*
 * Title: User token routes
 * Description: Handles all the things related to user tokens
 * Author: Amin Babu
 * Date: 08/18/2021
 */

// dependencies
const lib = require('../../lib/crudOperations');
const { parseJSON, createHash, createRandomStr } = require('../../lib/utilities');
const environment = require('../../helpers/environments');

// handler object - module scaffolding
const handler = {};

// function to handle token route
handler.userTokenRoute = (requestedProps, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    const method = requestedProps.method.toLowerCase();

    // verify user requested method
    if (acceptedMethods.indexOf(method) > -1) {
        // define the right operation
        handler._token[method](requestedProps, callback);
    } else {
        callback(405, {
            error: 'Operation is not allowed!',
        });
    }
};

// _user object - module scaffolding
handler._token = {};

// function to create a new token
handler._token.post = (requestedProps, callback) => {
    // user requested data validation
    const phone =
        typeof requestedProps.body.phone === 'string' &&
        requestedProps.body.phone.trim().length === 11
            ? requestedProps.body.phone
            : false;

    const password =
        typeof requestedProps.body.password === 'string' && requestedProps.body.password.length >= 4
            ? requestedProps.body.password
            : false;

    if (phone && password) {
        // lookup the requested user
        lib.readFile('users', phone, (err1, userData) => {
            // parse user data
            const userObject = { ...parseJSON(userData) };

            // create hash for reuqested user password
            const reuqestedPass = createHash(password);

            if (!err1 && reuqestedPass === userObject.password) {
                // construct token object
                const tokenID = createRandomStr(environment.tokenLen);
                const exipireTime = Date.now() + 60 * 60 * 1000;
                const token = {
                    phone,
                    id: tokenID,
                    expires: exipireTime,
                };

                // store token to the database
                lib.createFile('tokens', tokenID, token, (err2) => {
                    if (!err2) {
                        callback(200, token);
                    } else {
                        callback(500, {
                            error: 'ERR! Server side. Could not create token.',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Invalid request! Please check your password.',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to read user requested token data
handler._token.get = (requestedProps, callback) => {
    // user requested data validation
    const id =
        typeof requestedProps.queries.get('id') === 'string' &&
        requestedProps.queries.get('id').trim().length === environment.tokenLen
            ? requestedProps.queries.get('id')
            : false;

    if (id) {
        // lookup the requested user
        lib.readFile('tokens', id, (err1, tokenData) => {
            if (!err1 && tokenData) {
                // turn user data into valid JS object
                const tokenObject = { ...parseJSON(tokenData) };

                callback(200, tokenObject);
            } else {
                callback(500, {
                    error: 'ERR! Internal server problem or user token may not exists.',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to update user requested token data
handler._token.put = (requestedProps, callback) => {
    // user requested data validation
    const id =
        typeof requestedProps.body.id === 'string' &&
        requestedProps.body.id.trim().length === environment.tokenLen
            ? requestedProps.body.id
            : false;
    const extend =
        typeof requestedProps.body.extend === 'boolean' && requestedProps.body.extend === true
            ? requestedProps.body.extend
            : false;

    if (id && extend) {
        // lookup the requested user
        lib.readFile('tokens', id, (err1, tokenData) => {
            if (!err1 && tokenData) {
                // turn token data into valid JS object
                const token = { ...parseJSON(tokenData) };

                // check if token is not expired
                if (token.expires > Date.now()) {
                    // extends token expirey time
                    token.expires = Date.now() + 60 * 60 * 1000;

                    // update token data
                    lib.updateFile('tokens', id, token, (err2) => {
                        if (!err2) {
                            callback(200, {
                                message: 'Requested token successfully updated!',
                            });
                        } else {
                            callback(500, {
                                error: 'ERR! Server side. Could not update requested token data.',
                            });
                        }
                    });
                } else {
                    callback(400, {
                        error: 'ERR! Requested token is invalid.',
                    });
                }
            } else {
                callback(404, {
                    error: 'ERR! Requested user token could not found, it may not exists.',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to delete requested token data
handler._token.delete = (requestedProps, callback) => {
    // user requested data validation
    const id =
        typeof requestedProps.queries.get('id') === 'string' &&
        requestedProps.queries.get('id').trim().length === environment.tokenLen
            ? requestedProps.queries.get('id')
            : false;

    if (id) {
        // loopup the requested user token
        lib.readFile('tokens', id, (err1, tokenData) => {
            if (!err1 && tokenData) {
                // delete requested user token
                lib.deleteFile('tokens', id, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'Requested user token data successfully deleted!',
                        });
                    } else {
                        callback(500, {
                            error: 'ERR! Server side. Could not delete the user token data.',
                        });
                    }
                });
            } else {
                callback(404, {
                    error: 'ERR! Requested user token may not exists.',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to verify requested token
handler._token.verify = (id, phone, callback) => {
    // loopup the requested token data
    lib.readFile('tokens', id, (err1, tokenData) => {
        if (!err1 && tokenData) {
            // parse token data
            const token = { ...parseJSON(tokenData) };

            if (token.phone === phone && token.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// export handler object
module.exports = handler;
