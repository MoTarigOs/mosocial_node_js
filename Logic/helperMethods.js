const WL = require('../Data/WhiteList');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const fsPromise = require('fs').promises;
var nodemailer = require('nodemailer');
const givenSet = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
const validator = require('validator');

const updateWhiteListAccessToken = async (email, accessToken, refreshToken) => {
    try{
        if(!email || !accessToken || !refreshToken)
            return false; 

        if(!accessToken || !refreshToken)
            return false;

        const token = await WL.findOneAndUpdate({email}, {accessToken: accessToken, refreshToken: refreshToken});

        console.log("Token saved in WL: ", token);

        if(!token) {
            const createWLuser = await WL.create({
                email,
                accessToken: accessToken,
                refreshToken: refreshToken
            });

            if(!createWLuser)
                return false;

            return true;
        }

        return true;    
    } catch(err){
        console.log(err.message);
        return false;
    }
}

const checkWhiteListAccessToken = async (email, accessToken) => {
    try{

        if(!email || !accessToken)
            return false;

        const token = await WL.findOne({email});

        if(!token?.accessToken)  
            return false;

        if(token.accessToken !== accessToken)
            return false;

        return true;    
    } catch(err){
        return false;
    }
}

const deleteTokens = async (email) => {
    try{
        const delTokens = await WL.findOneAndUpdate({email}, {accessToken: null, refreshToken: null});
        if(!delTokens)
            return false;
        return true; 
    } catch (err){
        console.log(err);
        return false;
    }
}

const fetchAccessToken = async(accessToken) => {

    const url = process.env.GOOGLE_GET_USER_INFO_FROM_TOKEN;

    const axiosConfig = {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    }

    try{
        const res = await axios.post(url, null, axiosConfig);
        return res;
    } catch(err){
        console.log(err.message);
        return null;
    }
}

const getRandomPassword = () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const passwordLength = 32;
    let password = "";

    for (var i = 0; i <= passwordLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber +1);
    }

    return password;
}

const validateImageType = (image) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if(allowedTypes.includes(image.mimetype))
      return true;
    return false;
}

const handleImage = async(image) => {



    //const file_name = `${path.parse(image.name)}${Date.now()}.jpg`;

    // console.log(file_name);

    // try{
        
    //     await fsPromise.writeFile(path.join(__dirname, 'upload', `${file_name}`), image);
    //     const image_URL = path.join(__dirname, 'upload', file_name);
    //     return image_URL;

    // } catch(err){
    //     console.log(err.message);
    //     return null;
    // }

};

const generateRandomCode = () => {

    let code = "";
    for(let i = 0; i < 6; i++) {
        const pos = Math.floor(Math.random()*givenSet.length);
        code += givenSet[pos];
    }
    return code;

};

const sendToEmail = async(msg, userEmail, gmailAccount, appPassword) => {

    return new Promise(function(resolve, reject) {

        try{

            const sanitizedText = validator.escape(msg);

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailAccount,
                    pass: appPassword  //App password not actual account password
                }
            });

            let htmlText = '';

            console.log("personal email: ", process.env.PERSONAL_EMAIL);

            if(userEmail !== process.env.PERSONAL_EMAIL){
                htmlText = `<html lang="en" style="margin: 0; padding: 0; width: 100%"><body style="margin: 0; padding: 0; width: 100%"><div style="width: 100%; display: flex; justify-content: center; align-items: center;"><h1 style="height: fit-content; font-size: 42px; border: solid 2px; border-radius: 4px; padding: 8px 16px; letter-spacing: 1px;">${sanitizedText}</h1></div></body></html>`
            } else {
                htmlText = `<html lang="en" style="margin: 0; padding: 0; width: 100%"><body style="margin: 0; padding: 0; width: 100%"><div style="width: 100%; display: flex; flex-direction: column; gap: 8px; padding: 12px;">${sanitizedText}</div></body></html>`
            }
    
            var mailOptions = {
                from: gmailAccount,
                to: userEmail,
                subject: 'MoSocial', //title
                html: htmlText
            };
    
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    reject(false);
                } else {
                    resolve(true)
                }
            });
        } catch(err){
            console.log(err.message);
        }

    });
};

const logDeletedPic = async(pics) => {

    console.log("pics: ", pics);

    if(!pics || pics.length <= 0) return;

    let logObject = "";

    for (let i = 0; i < pics.length; i++) {
        logObject += validator.escape(`{"name": "${pics[i]}"}` + "\n");
    }

    await fsPromise.appendFile(path.join(__dirname, "..", "Log", "DeleteCloudPics.log"), logObject);

};

const escapeHtmlandJS = (text) => {
    return validator.escape(text);
};

module.exports = {
    updateWhiteListAccessToken, 
    checkWhiteListAccessToken, 
    deleteTokens, 
    fetchAccessToken, 
    getRandomPassword,
    validateImageType,
    handleImage,
    generateRandomCode,
    sendToEmail,
    logDeletedPic,
    escapeHtmlandJS
};