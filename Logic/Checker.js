const User = require('../Data/UserModel');
const validator = require('validator');

const testChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$ -!_*&%?.#+/";

const isValidPassword = (ps) => {

    if(typeof ps !== "string" || ps.length < 8 || ps.length > 30) return false;

    for (let i = 0; i < ps.length; i++) {

        let passed = false;

        for (let j = 0; j < testChars.length; j++) {
            if(ps[i] === testChars[j]) 
                passed = true;
        }

        if(!passed) return false;

    };

    return true;

};

const isValidUsername = async(username) => {

    if(typeof username !== "string") return false;

    var regexPattern = /^[A-Za-z][A-Za-z0-9_]{1,32}$/;

    if(!regexPattern.test(username))
      return false;

    const user = await User.findOne({ username: username }).select("username");
    
    if(user) return false;

    return true;

};

const isSecuredContact = (name_of_app, url) => {

    if(!validator.isURL(url)) return false;
    
    return true;
};

const isValidEmail = (email) => {

    if(typeof email !== "string" || email.length < 5 || email.length > 30) return false;

    const regexPattern = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,})$/;

    if(!regexPattern.test(email))
      return false;
  
    return true;

};

const isValidText = (text) => {

    if(!text || typeof text !== "string" || text.length <= 0) return false;

    for (let i = 0; i < text.length; i++) {

        let passed = false;

        for (let j = 0; j < testChars.length; j++) {
            if(text[i] === testChars[j]) 
                passed = true;
        }

        if(!passed) return false;

    };
    
    return true;
};

module.exports = { 
    isValidPassword, isValidUsername, isSecuredContact,
    isValidEmail, isValidText
}