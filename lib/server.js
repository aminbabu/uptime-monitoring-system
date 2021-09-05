/*
 * Title: API server
 * Description: Module that creates api server
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// dependencies
const http = require('http');
const { handleReqRes } = require('../helpers/handleReqRes');
const environtment = require('../helpers/environments');

// server object - module scaffolding
const server = {};

// function to create server instance
server.createServer = () => {
    // create web server
    const webServer = http.createServer(handleReqRes);

    // define server's listening port
    webServer.listen(environtment.port, (error) => {
        if (!error) {
            console.log(`Server is running on prot: ${environtment.port}`);
        } else {
            console.error(error);
        }
    });
};

server.init = () => {
    server.createServer();
};

// export server object
module.exports = server;
