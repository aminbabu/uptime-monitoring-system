/*
 * Title: Routes handler
 * Description: Handles all the routes in this api
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// dependencies
const { userCheckRoute } = require('../handlers/routeHandlers/userCheckRoute');
const { userRoute } = require('../handlers/routeHandlers/userRoute');
const { userTokenRoute } = require('../handlers/routeHandlers/userTokenRoute');

// routes object - module scaffolding
const routes = {
    user: userRoute,
    token: userTokenRoute,
    check: userCheckRoute,
};

// export routes object
module.exports = routes;
