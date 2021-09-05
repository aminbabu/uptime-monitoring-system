/*
 * Title: User routes
 * Description: Handles all the things related to user route
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// dependencies
const lib = require('../../lib/crudOperations');
const { parseJSON, createHash } = require('../../lib/utilities');
const tokenHanlder = require('./userTokenRoute');

// handler object - module scaffolding
const handler = {};

// function to handle user route
handler.userRoute = (requestedProps, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    const method = requestedProps.method.toLowerCase();

    // verify user requested method
    if (acceptedMethods.indexOf(method) > -1) {
        // define the right operation
        handler._user[method](requestedProps, callback);
    } else {
        callback(405, {
            error: 'Operation is not allowed!',
        });
    }
};

// _user object - module scaffolding
handler._user = {};

// function to create a new user
handler._user.post = (requestedProps, callback) => {
    // user requested data validation
    const firstName =
        typeof requestedProps.body.firstName === 'string' &&
        requestedProps.body.firstName.trim().length > 0
            ? requestedProps.body.firstName
            : false;

    const lastName =
        typeof requestedProps.body.lastName === 'string' &&
        requestedProps.body.lastName.trim().length > 0
            ? requestedProps.body.lastName
            : false;

    const phone =
        typeof requestedProps.body.phone === 'string' &&
        requestedProps.body.phone.trim().length === 11
            ? requestedProps.body.phone
            : false;

    const password =
        typeof requestedProps.body.password === 'string' && requestedProps.body.password.length >= 4
            ? requestedProps.body.password
            : false;

    const tosAgreement =
        typeof requestedProps.body.tosAgreement === 'boolean'
            ? requestedProps.body.tosAgreement
            : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // lookup the requested user
        lib.readFile('users', phone, (err1, userData) => {
            if (err1 && !userData) {
                // create new user object
                const newUser = {
                    firstName,
                    lastName,
                    phone,
                    password: createHash(password),
                    tosAgreement,
                };

                // create a new user into database
                lib.createFile('users', phone, newUser, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'Request user successfully created!',
                        });
                    } else {
                        callback(500, {
                            error: 'ERR! Could not create user. Please try again later.',
                        });
                    }
                });
            } else {
                callback(500, {
                    error: 'ERR! Server side or user may already exists.',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to read user requested data
handler._user.get = (requestedProps, callback) => {
    // user requested data validation
    const phone =
        typeof requestedProps.queries.get('phone') === 'string' &&
        requestedProps.queries.get('phone').trim().length === 11
            ? requestedProps.queries.get('phone')
            : false;

    if (phone) {
        // token verification
        const token =
            typeof requestedProps.headers.token === 'string' &&
            requestedProps.headers.token.trim().length > 0
                ? requestedProps.headers.token
                : false;

        tokenHanlder._token.verify(token, phone, (isTokenValid) => {
            if (isTokenValid) {
                // lookup the requested user
                lib.readFile('users', phone, (err1, userData) => {
                    if (!err1 && userData) {
                        // turn user data into valid JS object
                        const userObject = { ...parseJSON(userData) };

                        // delete user password from user data
                        delete userObject.password;

                        callback(200, userObject);
                    } else {
                        callback(404, {
                            error: 'ERR! Requested user data may not exists.',
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
        callback(400, {
            error: 'Invalid request! Please check and try again.',
        });
    }
};

// function to update user requested data
handler._user.put = (requestedProps, callback) => {
    // user requested data validation
    const firstName =
        typeof requestedProps.body.firstName === 'string' &&
        requestedProps.body.firstName.trim().length > 0
            ? requestedProps.body.firstName
            : false;

    const lastName =
        typeof requestedProps.body.lastName === 'string' &&
        requestedProps.body.lastName.trim().length > 0
            ? requestedProps.body.lastName
            : false;

    const phone =
        typeof requestedProps.body.phone === 'string' &&
        requestedProps.body.phone.trim().length === 11
            ? requestedProps.body.phone
            : false;

    const password =
        typeof requestedProps.body.password === 'string' && requestedProps.body.password.length >= 4
            ? requestedProps.body.password
            : false;

    if (phone) {
        // determine requested data to update
        if (firstName || lastName || password) {
            // token verification
            const token =
                typeof requestedProps.headers.token === 'string' &&
                requestedProps.headers.token.trim().length > 0
                    ? requestedProps.headers.token
                    : false;

            tokenHanlder._token.verify(token, phone, (isTokenValid) => {
                if (isTokenValid) {
                    // lookup the requested user
                    lib.readFile('users', phone, (err1, userData) => {
                        if (!err1 && userData) {
                            // turn user data into valid JS object
                            const userObject = { ...parseJSON(userData) };

                            if (firstName) userObject.firstName = firstName;
                            if (lastName) userObject.lastName = lastName;
                            if (password) userObject.password = createHash(password);

                            // update the user data
                            lib.updateFile('users', phone, userObject, (err2) => {
                                if (!err2) {
                                    callback(200, {
                                        message: 'User data successfully updated!',
                                    });
                                } else {
                                    callback(500, {
                                        error: 'ERR! Server side. Could not update user data.',
                                    });
                                }
                            });
                        } else {
                            callback(404, {
                                error: 'ERR! Could not found user data or user may not exists.',
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
            callback(400, {
                error: 'Invalid request! Please check and try again.',
            });
        }
    } else {
        callback(400, {
            error: 'Invalid request! Please check your phone and password then try again.',
        });
    }
};

// function to delete requested user data
handler._user.delete = (requestedProps, callback) => {
    // user requested data validation
    const phone =
        typeof requestedProps.queries.get('phone') === 'string' &&
        requestedProps.queries.get('phone').trim().length === 11
            ? requestedProps.queries.get('phone')
            : false;

    if (phone) {
        // token verification
        const token =
            typeof requestedProps.headers.token === 'string' &&
            requestedProps.headers.token.trim().length > 0
                ? requestedProps.headers.token
                : false;

        tokenHanlder._token.verify(token, phone, (isTokenValid) => {
            if (isTokenValid) {
                // loopup the requested user
                lib.readFile('users', phone, (err1, userData) => {
                    if (!err1 && userData) {
                        // delete requested user data
                        lib.deleteFile('users', phone, (err2) => {
                            if (!err2) {
                                callback(200, {
                                    message: 'Requested user data successfully deleted!',
                                });
                            } else {
                                callback(500, {
                                    error: 'ERR! Server side. Could not delete the user data.',
                                });
                            }
                        });
                    } else {
                        callback(404, {
                            error: 'ERR! Requested user may not exists.',
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
        callback(400, {
            error: 'Invalid request! Please check phone and password and try again.',
        });
    }
};

// export handler object
module.exports = handler;
