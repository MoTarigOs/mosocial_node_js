const buildLogger = require('../Logger/ProdLogger');
const logger = buildLogger();

const LogEvents = (req, res, next) => {

    console.log("Log event\n");
    
    const _method = req.method;
    const requestUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const user_username = req.user?.username ? req.user.username : (req?.body?.username ? req.body.username : null);
    const user_id = req.user?.id ? req.user.id : null;
    const user_email = req.user?.email ? req.user.email : (req?.body?.email ? req.body.email : null);
    const address = req.ip || req.ips;

    let isAuthenticated = false;
    if(user_id && user_email && user_username) isAuthenticated = true;

    logger.info('New Request event', {userId: user_id, method: _method, req_url: requestUrl, username: user_username, user_address: address, user_email: user_email, authenticated: isAuthenticated});

    next();

};

module.exports = LogEvents;