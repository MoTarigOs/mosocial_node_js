const express = require('express');
const router = express.Router();
const passport = require('passport');
require('./GoogleStrategy');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../../Data/UserModel');
const jwt = require('jsonwebtoken');
const { fetchAccessToken, usernameSuggesions, updateWhiteListAccessToken } = require('../helperMethods');
const { isValidUsername } = require('../Checker');

router.get('/', 
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

router.get('/callback',
    passport.authenticate('google'),
    asyncHandler(async(req, res) => {

        if(!req?.user?.access_token  || !req?.user?.profile || !req?.user?.profile?.email || !req?.user?.profile?.given_name)
            return res.status(404).json({ message: "Error reading info" });
    
        const fetchedToken = await fetchAccessToken(req.user.access_token);
    
        if(!fetchedToken?.data?.email)
            return res.status(404).json({ message: "no info" });  
    
        const email = req.user.profile.email;
        const photoUrl = req.user.profile.picture;
        const given_name = req.user.profile.given_name;
    
        if(email !== fetchedToken.data.email)
            return res.status(404).json({ message: "error please enter valid info :(" });
    
        const userExist = await User.findOne({ email: fetchedToken.data.email });
    
        if(!userExist){
    
            const pw = crypto.randomBytes(32).toString();
            const hashedPw = bcrypt.hash(pw, 10);
    
            let username = "";
    
            if(!isValidUsername(given_name)){
                username = await usernameSuggesions(given_name);
            }
    
            const user = await User.create({
                username: username,
                email: fetchedToken.data.email,
                password: hashedPw,
                oauth: true
            });
    
            if(!user)
                return res.status(403).json({ message: "error creating account" });
    
            userExist = user;    
    
        };
    
        if(!userExist?.oauth || userExist.oauth === false)
            return res.status(403).json({ message: "error logging to your account, please login using password" });

        console.log("userExist: ", userExist);    

        if(userExist.isBlocked){

            const elabsed = Date.now() - userExist.blocked.date_of_block;
    
            if(elabsed <= userExist.blocked.block_duration) 
                return res.status(403).send(`you are blocked come back after ${(userExist.blocked.block_duration - elabsed)/1000/60/60/24} days`);
        
            const blockObj = {
                date_of_block: null,
                block_duration: null
            };
    
            const updateBlockedUser = await User.findOneAndUpdate({ email: email }, { blocked: blockObj, isBlocked: false });
    
            if(!updateBlockedUser) return res.status(501).send("please try login again");
    
            const obj = {blocked_user_id: userExist._id};
    
            await Admin.updateOne({ blocked_users_ids: obj }, { $pull: { blocked_users_ids: obj } });
            
        };    
        
        const userAccessToken = jwt.sign({
            user: {
                username: userExist.username,
                email: userExist.email,
                id: userExist.id
            }
        },process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5d" }
        );
    
        const userRefreshToken = jwt.sign({
            user: {
                username: userExist.username,
                email: userExist.email,
                id: userExist.id
            }
        },process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" }
        );

        console.log("Email: ", userExist.email);
        console.log("Access token: ", userAccessToken);
        console.log("Refresh token: ", userRefreshToken);

        const updateWL = await updateWhiteListAccessToken(userExist.email, userAccessToken, userRefreshToken);
    
        if(updateWL){
            res.cookie('_a_t', userAccessToken, { 
                path: '/', 
                httpOnly: true, 
                sameSite: 'None', 
                secure: true,
                maxAge: (5 * 24 * 60 * 60 * 1000)
            });
            res.cookie('_r_t', userRefreshToken, { 
                path: '/', 
                httpOnly: true, 
                sameSite: 'None', 
                secure: true,
                maxAge: (30 * 24 * 60 * 60 * 1000)
            });
            res.status(200);
            res.redirect(301, 'https://motarigos.github.io/mosocial/'); //https://motarigos.github.io/mosocial/   ,  http://localhost:3000/
        } else {
            res.status(501).json({message: "We are sorry something went wrong!, please try login again"})
            res.clearCookie('_a_t');
            res.clearCookie('_r_t');
            res.redirect(301, 'https://motarigos.github.io/mosocial/');
        }
    
    })
);

module.exports = router;