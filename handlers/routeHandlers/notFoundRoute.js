/*
 * Title: Not found routes
 * Description: Handles all the things related to 404 not found route
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// notFound object - module scaffolding
const notFound = {};

// function to handle notFound route
notFound.notFoundRoute = (requestedProps, callback) => {
    callback(404, {
        message: '404 - request not found!',
    });
};

// export notFound object
module.exports = notFound;
