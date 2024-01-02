const validator = require('validator');
const { isValidUsername, isValidEmail, isValidText } = require('./Logic/Checker');


const testChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$ !_*&%?";
const sample = "2MBUKH";

console.log("is valid sample? ", sample, " :", isValidText(sample));


//method()
// sanitize(melicousString);
// sanitize(melicousString1);
// sanitize(melicousString2);



// const melicousString = "hello this normal text";

// const melicousString1 = "<h2>Injected melicous code</h2>";

// const melicousString2 = "const function () = {if(x) x;};";