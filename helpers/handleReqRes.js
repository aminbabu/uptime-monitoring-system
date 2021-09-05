/*
 * Title: Request & response handler
 * Description: Handler that handles user requests & responses
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// dependencies
const { StringDecoder } = require('string_decoder');
const { parseJSON } = require('../lib/utilities');
const routes = require('../routes/routes');
const { notFoundRoute } = require('../handlers/routeHandlers/notFoundRoute');

// hander object - module scaffolding
const handler = {};

// function to handle requests & responses
handler.handleReqRes = (req, res) => {
    // request handling
    // extract required url parts
    const { method, headers } = req;
    const requestedUrl = new URL(`${req.protocol}://${req.headers.host}${req.url}`);
    const { pathname, searchParams } = requestedUrl;
    const genericPathName = pathname.replace(/^\/|\/$/, '');

    // construct an object for requested properties
    const requestedProps = {
        method,
        pathname: genericPathName,
        queries: searchParams,
        headers,
    };

    // handle user requested data
    let requestedData = '';

    // create decoder to parse user data
    const decoder = new StringDecoder('utf-8');

    // determine the user requested route
    const currentRoute =
        typeof requestedProps.pathname === 'string' && routes[requestedProps.pathname]
            ? routes[requestedProps.pathname]
            : notFoundRoute;

    // collects data from the user
    req.on('data', (buffer) => {
        requestedData += decoder.write(buffer);
    });

    // ensure data collection is finished
    req.on('end', () => {
        requestedData += decoder.end();

        // include user requested data to requested properties object
        requestedProps.body = parseJSON(requestedData);

        // route handling
        currentRoute(requestedProps, (statusCode, payload) => {
            // callback data verificaiton
            const status = typeof statusCode === 'number' ? statusCode : 500;
            const payloadStr = typeof payload === 'object' ? payload : {};
            const serverResponse = JSON.stringify(payloadStr);

            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(serverResponse);
        });
    });
};

// export handler object
module.exports = handler;
