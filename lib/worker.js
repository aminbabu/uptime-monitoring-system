/**
 * Title: Worker library
 * Description: Worker related things
 * Author: Amin Babu
 * Date: 09/04/2021
 *
 */

// dependencies
const http = require('http');
const https = require('https');
const lib = require('./crudOperations');
const { parseJSON } = require('./utilities');
const { sendSMS } = require('../helpers/notifications');

// worker object - module scaffolding
const worker = {};

// function to get all the checks
worker.gatherAllChecks = () => {
    // get the check list
    lib.listFiles('checks', (err1, checks) => {
        if (!err1 && checks && checks.length > 0) {
            checks.forEach((check) => {
                // lookup the check data
                lib.readFile('checks', check, (err2, checkData) => {
                    if (!err2 && checkData) {
                        // turn check data into valid JS object
                        const originalCheckData = { ...parseJSON(checkData) };
                        // pass check data to validate
                        worker.validateCheckData(originalCheckData);
                    } else {
                        console.log('ERR! Reading one of the check data.');
                    }
                });
            });
        } else {
            console.log('ERR! Check list was not found.');
        }
    });
};

// function to validate individual check data
worker.validateCheckData = (originalCheckData) => {
    if (originalCheckData && originalCheckData.id) {
        const checkObject = { ...originalCheckData };

        checkObject.state =
            typeof checkObject.state === 'string' && ['up', 'down'].indexOf(checkObject.state) > -1
                ? checkObject.state
                : 'down';

        checkObject.lastChecked =
            typeof checkObject.lastChecked === 'number' && checkObject.lastChecked > 0
                ? checkObject.lastChecked
                : false;

        // pass check object to the perform checking
        worker.performCheck(checkObject);
    } else {
        console.log('ERR! Check was invaid or not properly formatted.');
    }
};

// function to perform individual check
worker.performCheck = (originalCheckData) => {
    // construct check outcome object
    const checkOutcome = {
        error: false,
        statusCode: false,
    };

    // outcome tracker
    let outcomeSent = false;

    // parse the hostname & full url path from original check data
    const fullPath = new URL(`${originalCheckData.protocol}://${originalCheckData.url}`);
    const { hostname, path } = fullPath;

    // construct request options
    const options = {
        protocol: `${originalCheckData.protocol}:`,
        hostname,
        path,
        method: originalCheckData.method.toUpperCase(),
        timeout: originalCheckData.timeoutSeconds * 1000,
    };

    // decide right protocol to request
    const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

    const req = protocolToUse.request(options, (res) => {
        const { statusCode } = res;

        // update the checkout come and pass to the next process
        checkOutcome.statusCode = statusCode;
        if (!outcomeSent) {
            worker.processOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (err) => {
        checkOutcome.error = true;
        checkOutcome.value = err;

        if (!outcomeSent) {
            worker.processOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutcome.error = true;
        checkOutcome.value = 'timeout';

        if (!outcomeSent) {
            worker.processOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // send the request
    req.end();
};

// function to process check outcome
worker.processOutcome = (originalCheckData, checkOutcome) => {
    const state =
        !checkOutcome.error &&
        checkOutcome.statusCode &&
        originalCheckData.successCodes.indexOf(checkOutcome.statusCode) > -1
            ? 'up'
            : 'down';

    const alertWanted = !!(originalCheckData.lastChecked && originalCheckData.state !== state);

    // destructure original check data
    const newCheckData = { ...originalCheckData };

    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // update the check data
    lib.updateFile('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWanted) {
                // send the check data to next process
                worker.alertUseToStatusChange(newCheckData);
            } else {
                console.log('Alert is not need as there is no state change.');
            }
        } else {
            console.log('ERR! trying to update check data of one of the checks.');
        }
    });
};

// function to notify user if change any state of the check
worker.alertUseToStatusChange = (newCheckData) => {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${
        newCheckData.protocol
    }://${newCheckData.url} is currently ${newCheckData.state}.`;

    // notify the user
    sendSMS(newCheckData.phone, msg, (err) => {
        if (!err) {
            console.log(`User was alerted to a status change via SMS: ${msg}`);
        } else {
            console.log('There was a problem sending SMS to one of the users!');
        }
    });
};

// function to loop through checks
worker.loopThroughChecks = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 15000);
};

// function to initiate workers
worker.init = () => {
    // gather all the checks
    worker.gatherAllChecks();

    // loop through the checking process
    worker.loopThroughChecks();
};

// export worker object
module.exports = worker;
