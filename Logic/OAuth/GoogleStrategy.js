const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../../Data/UserModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { isValidUsername } = require('../../Logic/Checker');
const { usernameSuggesions, getRandomPassword } = require('../../Logic/helperMethods');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://mosocial-backend.onrender.com/user/oauth/google/callback',
    passReqToCallback: true
  },
  asyncHandler(async function(request, accessToken, refreshToken, profile, done) {
    // find or create user in db here & use other google services

    let data = {};

    if(profile?.email){

        const userExist = await User.findOne({email: profile.email});

        if(!userExist?.email){

            const pw = getRandomPassword();
            const hashedPw = await bcrypt.hash(pw, 10);

            let user_name = "";

            if(!await isValidUsername(profile.given_name)){
                user_name = await usernameSuggesions(profile.given_name);
            } else{
                user_name = profile.given_name;
            }

            const user = await User.create({
                username: user_name,
                email: profile.email,
                password: hashedPw,
                oauth: true
            });

            if(user)
                data = {profile, access_token: accessToken};
        
        } else {

            data = {profile, access_token: accessToken};

        } 
    }
    
    return done(null, data);
  })
));

passport.serializeUser(function(user, done) {
    done(null, user);
})

passport.deserializeUser(function(user, done) {
    done(null, user);
})