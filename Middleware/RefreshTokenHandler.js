const WL = require('../Data/WhiteList');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { updateWhiteListAccessToken } = require('../Logic/helperMethods');

const handleRefreshToken = asyncHandler( async (req, res) => {

    const refreshToken = req?.cookies?._r_t ? req.cookies._r_t : null;

    if(!refreshToken) return res.status(400).json({ message: "Error with tokens please login to your account" });

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler( async(err, decoded) => {
            if(err || !decoded?.user?.email) 
                return res.sendStatus(403);

            const validToken = await WL.findOne({email: decoded.user.email});

            if(!validToken) return res.status(501).json({ message: "Error with tokens please login to your account" });

            if(!validToken?.refreshToken)
                return res.status(401).json({message: "not valid Token"});

            if(validToken.refreshToken !== refreshToken){
                return res.status(401).json({message: "Expired token"});
            } else {
                const accessToken = jwt.sign({
                    user: {
                        username: decoded.user.username,
                        email: decoded.user.email,
                        id: decoded.user.id
                    }
                },process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "5d" }
                );
        
                const refreshToken = jwt.sign({
                    user: {
                        username: decoded.user.username,
                        email: decoded.user.email,
                        id: decoded.user.id
                    }
                },process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "30d" }
                );

                const updateList = await updateWhiteListAccessToken(decoded.user.email, accessToken, refreshToken);

                if(!updateList){
                    return res.status(401).send("Error please try again or login to your account");
                }
                
                res.status(201);
                res.cookie('_a_t', accessToken, { 
                    path: '/', 
                    httpOnly: true, 
                    sameSite: 'None', 
                    secure: true, 
                    maxAge: (5 * 24 * 60 * 60 * 1000)
                });
                res.cookie('_r_t', refreshToken, { 
                    path: '/', 
                    httpOnly: true, 
                    sameSite: 'None', 
                    secure: true, 
                    maxAge: (30 * 24 * 60 * 60 * 1000)
                });
                res.send("refreshed");

            }
        })
    )
});

module.exports = {handleRefreshToken};