/*
 * Title: Environment variables
 * Description: Module that define all the envieonment variables
 * Author: Amin Babu
 * Date: 08/14/2021
 */

// environments object - module scaffolding
const environments = {};

// environment for development
environments.development = {
    envName: 'development',
    port: 3000,
    secretKey: 'lksjlf snfks n234kj afc h',
    tokenLen: 26,
    checkLen: 25,
    twilio: {
        fromPhone: '+15125533753',
        accountSID: 'ACca3d79fb916925f53da9eced2219bfcc',
        authToken: '913f9fc120cd567f1738191e1bbea5dd',
    },
};

// environment for production
environments.production = {
    envName: 'production',
    port: 5000,
    secretKey: 'alskjf foiue 093e5c341984e4fvas a ',
    tokenLen: 26,
    checkLen: 25,
    twilio: {
        fromPhone: '+15125533753',
        accountSID: 'ACca3d79fb916925f53da9eced2219bfcc',
        authToken: '913f9fc120cd567f1738191e1bbea5dd',
    },
};

// get the requested environment
const requestedEnv =
    typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'development';

// determine the corresponding environment
environments.currentEnvironment =
    typeof environments[requestedEnv] === 'object'
        ? environments[requestedEnv]
        : environments.development;

// export requested environment object
module.exports = environments.currentEnvironment;
