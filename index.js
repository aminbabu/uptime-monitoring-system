/*
 * Title: Uptime monitoring system
 * Description: An uptime monitoring system built with RESTFull API
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// dependencies
const server = require('./lib/server');
const worker = require('./lib/worker');

// app object - module scaffolding
const app = {};

// fucntion to create workflow
app.init = () => {
    // start web server
    server.init();

    // start workers
    worker.init();
};

// call the start server function
app.init();

// export app object
module.exports = app;
