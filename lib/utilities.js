/*
 * Title: Utility library
 * Description: Library that handles all the utility related things
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// dependencies
const crypto = require('crypto');
const environment = require('../helpers/environments');

// utilities object - module scaffolding
const utilities = {};

// JSON parser
utilities.parseJSON = (data) => {
    let result;

    try {
        result = JSON.parse(data);
    } catch (error) {
        result = {};
    }

    return result;
};

// create hash
utilities.createHash = (str) => {
    if (typeof str === 'string' && str.trim().length > 0) {
        const hmac = crypto.createHmac('sha256', environment.secretKey).update(str).digest('hex');
        return hmac;
    }
    return false;
};

// create random string
utilities.createRandomStr = (strLen) => {
    const length = typeof strLen === 'number' && strLen > 0 ? strLen : false;

    if (length) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';
        const possibleCharactersLen = possibleCharacters.length;
        let output = '';

        for (let i = 0; i < length; i += 1) {
            const randomChar = possibleCharacters.charAt(
                Math.floor(Math.random() * possibleCharactersLen),
            );
            output += randomChar;
        }
        return output;
    }
    return false;
};

// export utilities object
module.exports = utilities;
