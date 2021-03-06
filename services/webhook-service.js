const logger = require('./logger');

module.exports.isEstablishingWebHookProcess = req => req && req.headers && req.headers['x-hook-secret'];

module.exports.handleHandShake = (req, res) => {
    logger.log('Confirmation handshake with an X-Hook-Secret header: ' + req.headers[ 'x-hook-secret' ]);

    res
        .set("x-hook-secret", req.headers[ 'x-hook-secret' ])
        .sendStatus(200);
};
