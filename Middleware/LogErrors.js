const buildLogger = require('../Logger/ProdLogger');
const logger = buildLogger();

const LogErrors = (err, req, res, next) => {

    console.log("Log error:  -->  statusCode: ", err.statusCode, " message: ", err.message);

    const _method = req.method;
    const requestUrl = req.url;
    const user_username = req.user?.username ? req.user.username : (req?.body?.username ? req.body.username : null);
    const user_id = req.user?.id ? req.user.id : null;
    const user_email = req.user?.email ? req.user.email : (req?.body?.email ? req.body.email : null);
    const address = req.ip || req.ips;

    let isAuthenticated = false;
    if(user_id && user_email && user_username) isAuthenticated = true;

    const errMsg = err.stack.toString().replaceAll(/[\n\r]/g, '');

    logger.error(errMsg, {userId: user_id, method: _method, req_url: requestUrl, username: user_username, user_address: address, user_email: user_email, authenticated: isAuthenticated});

    let resStatus = 500;

    if(err.statusCode) resStatus = err.statusCode;

    res.status(resStatus).send(err.message ? err.message : "Something went wrong");

    next(err);

};

module.exports = LogErrors;