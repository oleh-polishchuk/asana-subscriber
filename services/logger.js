const fs = require('fs');

const log = logFn => text => {
    fs.appendFile('default.log', `[asana-subscriber] ${text}\n`, 'utf8', () => {});
    logFn(`[asana-subscriber] ${text}`);
};

module.exports.log = msg => log(console.log)(msg);

module.exports.error = msg => log(console.error)(msg);
