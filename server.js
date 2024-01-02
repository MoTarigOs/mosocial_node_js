const express = require('express');
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const PORT = process.env.PORT || 3500;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimitMiddleware = require('./Middleware/RateLimiter');
const tooBusy = require('toobusy-js');
const buildLogger = require('./Logger/ProdLogger');
const logger = buildLogger();
const MemoryStore = require('memorystore')(session);

const connectDB = require('./Config/dbConnection');
const LogErrors = require('./Middleware/LogErrors');

connectDB();

//app.set('trust proxy', true);

app.use(cors({ origin: ['https://motarigos.github.io/mosocial/*', 'https://motarigos.github.io', 'http://localhost:3000'], credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'authorization'] }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
}));
app.use(helmet());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded( { extended: false })); 
app.use(express.json({ limit: "10kb" }));
app.use(rateLimitMiddleware);
app.use(function (req, res, next) {
    if(tooBusy()){
        return res.status(503).send("The server is too busy, please try again after a moment");
    } else {
        next();
    }
});
app.use((req, res, next) => {
    //if(req.cookies) req.headers["csrf-token"] = req.cookies.csrf_token; 
    console.log("csrf token: ", req.cookies.csrf_token);
    next();
});
app.use("/user", require("./Routes/UserRouter"));
app.use("/profile", require("./Routes/ProfileRouter"));
// app.use("/post", require("./Routes/PostRouter"));
// app.use("/comments", require("./Routes/CommentsRouter"));
// app.use("/chat", require("./Routes/ChatRouter"));
// app.use("/contacts", require("./Routes/ContactRouter"));
app.use("/report", require("./Routes/ReportRouter"));
app.use("/admin", require("./Routes/AdminRouter"));

app.disable('x-powered-by');

app.use(LogErrors);

process.on("uncaughtException", (err) => {

    const errMsg = err.stack.toString().replaceAll(/[\n\r]/g, '');

    logger.error(errMsg, () => {
        mongoose.disconnect();
        process.exit(0);
    });

});

mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    });
});
