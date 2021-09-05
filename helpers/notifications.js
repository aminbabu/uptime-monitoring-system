/**
 * Title: Notification module
 * Description: Important methods to notify users
 * Author: Amin Babu
 * Date: 09/03/2021
 *
 */

// dependencies
const https = require('https');
const { stringify } = require('querystring');
const { twilio } = require('./environments');

// notification object - module scaffolding
const notification = {};

// function to send twilio SMS
notification.sendSMS = (phone, msg, callback) => {
    // parameter validation
    const userPhone =
        typeof phone === 'string' && phone.trim().length === 11 ? phone.trim() : false;
    const userMsg =
        typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
            ? msg.trim()
            : false;

    if (userPhone && userMsg) {
        // construct payload for twilio
        const payload = {
            From: twilio.fromPhone,
            To: `+88${userPhone}`,
            Body: userMsg,
        };
        // stringify the payload
        const stringifiedPayload = stringify(payload);

        // construct https request options
        const options = {
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${twilio.accountSID}/Messages.json`,
            method: 'POST',
            auth: `${twilio.accountSID}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        // construct request object
        const req = https.request(options, (res) => {
            const status = res.statusCode;

            // callback successful if the request went through
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`Returned status code was: ${status}`);
            }
        });

        // handle error
        req.on('error', (err) => {
            callback(err);
        });

        req.write(stringifiedPayload);
        req.end();
    } else {
        callback('Given parameters were missing or invalid');
    }
};

// export notication object
module.exports = notification;

// notification.sendSMS('01621990178', 'Hello', (err) => {
//     console.log(err);
// });
