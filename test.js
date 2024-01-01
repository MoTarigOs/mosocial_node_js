const validator = require('validator');
const { isValidUsername } = require('./Logic/Checker');


const testChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$ !_*&%?";
const url = "http://x.xx.xx"

const isSecuredContact = (name_of_app, url) => {

    if(!validator.isURL(url)) return false;
    
    return true;
};

console.log("is valid contact url? ", url, " :", isSecuredContact(null, url));

const method = async() => {
    console.log("is valid text? ", username, " :", await isValidUsername(username));
}

//method()
// sanitize(melicousString);
// sanitize(melicousString1);
// sanitize(melicousString2);



// const melicousString = "hello this normal text";

// const melicousString1 = "<h2>Injected melicous code</h2>";

// const melicousString2 = "const function () = {if(x) x;};";