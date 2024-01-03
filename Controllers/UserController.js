const asyncHandler = require("express-async-handler");
const { isValidPassword, isValidUsername, isValidEmail, isValidText } = require("../Logic/Checker");
const { updateWhiteListAccessToken, deleteTokens, generateRandomCode, sendToEmail, logDeletedPic } = require('../Logic/helperMethods');
const WL = require('../Data/WhiteList');
const User = require('../Data/UserModel');
const Profile = require('../Data/ProfileModel');
const Post = require('../Data/PostModel');
const Comment = require('../Data/CommentModel');
const VerCode = require('../Data/VerificationCode');
const Chat = require('../Data/ChatModel');
const Contact = require('../Data/ContactModel');
const Admin = require('../Data/AdminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { default: axios } = require("axios");
const { default: mongoose } = require("mongoose");
const csurf = require('csurf');

const csrfProtection = csurf({
    cookie: {
        key: "csrf-token",
        path: "/",
        maxAge: 14400, //in seconds = 4 hours
        httpOnly: true,
        sameSite: "None",
        secure: true
    },
    value: (req) => req.cookies.csrf_token
});

const registerUser = asyncHandler(async(req, res) => {

    if(req?.body=== null || req?.body === undefined)
        return res.status(400).json({message: "Something gone wrong! please resend the request"})

    const { username, email, password, captchaToken } = req.body;
        
    if(!username || !email || !password)
        return res.status(402).json({message: "All field are required"});

    if(!captchaToken) return res.status(403).send("you are not human");

    const captchaRes = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    );

    if (!captchaRes.data.success) return res.status(403).send("You aren't a human");

    if(!isValidPassword(password))
        return res.status(400).json({message: "Not valid password"});

    if(!isValidUsername(username))
        return res.status(400).json({message: "Not valid username"});

    if(!isValidEmail(email))
        return res.status(400).json({message: "Not valid email"});

    /* check email availability */
    const emailAvailable = await User.findOne({email: email});
    if(emailAvailable)
        return res.status(403).send("Something wrong with creating account, please make sure you enter valid email :)");

    const checkEmailVerification = await VerCode.findOne({ email: email });    

    if(!checkEmailVerification.verified || checkEmailVerification.verified === false) 
        return res.status(403).send("please verify your account");

    /* hash the password */
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        oauth: false
    });

    if(!user) return res.status(400).json({ message: "user information are not valid!" });

    const createdProfile = await Profile.create({
        email: user.email,
        username: user.username,
        user_id: user._id,
        postsLiked: [],
        introInfo: {
            introParagraph: "",
            smallDetails: []
        },
        detailedInfo: {
            paragraph: "",
            skills: []
        },
        contacts: [],
        profileImage: "",
        notification: []
    });

    if(!createdProfile) return res.status(500).send("Try again later");

    res.status(201).send("Account Successfully created");

});

const sendCodeToEmail = asyncHandler( async(req, res) => {

    if(!req?.body) return res.status(404).send("Error in request");

    const { email } = req.body;

    if(!email || email.length <= 0) return res.status(403).send("No email found");

    /* check email availability */
    const emailAvailable = await User.findOne({email: email});
    if(emailAvailable)
        return res.status(403).send("Enter valid email :)");

    const code = generateRandomCode();

    const sendEmailRes = await sendToEmail(code, email, process.env.GMAIL_ACCOUNT, process.env.GMAIL_APP_PASSWORD);

    if(!sendEmailRes || sendEmailRes === false) return res.status(501).send("We encountered an error when sending the code please try again later");

    const verCodeRes = await VerCode.findOneAndUpdate({ email: email }, { code: code, date: Date.now() });

    if(!verCodeRes) {
        const verCodeCreate = await VerCode.create({
            email: email,
            code: code,
            date: Date.now()
        });

        if(!verCodeCreate) return res.status(501).send("Error in our server please try again later");
    };

    res.status(201).send("Code sent Successfully");

});

const verifyEmail = asyncHandler( async(req, res) => {

    if(!req?.body) return res.status(403).send("Error in the request");

    const { email, eCode } = req.body;

    if(!email || !eCode?.length || eCode.length !== 6) return res.status(403).send("Error in the request");

    if(!isValidEmail(email)) return res.status(400).send("please enter valid email");

    if(!isValidText(eCode)) return res.status(400).send("please enter valid verification code");

    const verCode = await VerCode.findOne({ email: email, code: eCode });

    if(!verCode || !verCode.date) return res.status(400).send("Send code first");

    if(Date.now() - verCode.date > (10 * 60 * 1000)) return res.status(403).send("please re send code");

    const updateVerCode = await VerCode.findOneAndUpdate({ email: email }, { code: null, date: null, verified: true });

    if(!updateVerCode) return res.status(501).send("Error in our server, please send another code");

    res.status(200).send("Successfully verified your Email :)");

});

const logUser = asyncHandler(async (req, res) => {

    if(req?.body === null || req?.body === undefined)
        return res.status(404).json({message: "Something gone wrong! please resend the request"});

    const { email, password, captchaToken } = req.body;
    
    if(!email || !password || !isValidEmail(email) || !isValidPassword(password))
        return res.status(400).json({message: "Enter valid email & password"});

    if(!captchaToken) return res.status(403).send("you are not human ?");

    const captchaRes = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    );

    if (!captchaRes.data.success) return res.status(403).send("You aren't a human");    

    const user = await User.findOne({ email: email });
    
    if(!user || user.oauth === null || user.oauth === undefined)
        return res.status(404).json({message: "No user found"});

    if(user.oauth === true)
        return res.status(403).json({message: "Please use google to login to your account"});

    if(user.isBlocked){

        console.log("this user is blocked");

        const elabsed = Date.now() - user.blocked.date_of_block;

        console.log("date of block: ", user.blocked.date_of_block);
        console.log("block duration: ", user.blocked.block_duration);
        console.log("elabsed: ", elabsed);

        if(elabsed <= user.blocked.block_duration) 
            return res.status(402).json({ blockTime: (user.blocked.block_duration - elabsed) });
    
        const blockObj = {
            date_of_block: null,
            block_duration: null
        };

        const updateBlockedUser = await User.findOneAndUpdate({ email: email }, { blocked: blockObj, isBlocked: false });

        if(!updateBlockedUser) return res.status(501).send("please try login again");

        const obj = {blocked_user_id: user._id};

        await Admin.updateOne({ blocked_users_ids: obj }, { $pull: { blocked_users_ids: obj } });
        
    };    

    if((await bcrypt.compare(password, user.password))){

        const accessToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        },process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5d" }
        );

        const refreshToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        },process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" }
        );

        if(await updateWhiteListAccessToken(user.email, accessToken, refreshToken)){

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
            res.send("success");
        } else {
            res.status(501).json({message: "We are sorry something went wrong!, please try login again"});
        }

    } else {
        return res.status(403).json({message: "Something wrong with your input"});
    }
});

const logOut = asyncHandler(async(req, res) => {
    
    if(await deleteTokens(req.user.email) === false)
        return res.status(400).json({message: "We are not sure that you logged out successfully :("});

    res.clearCookie('_a_t');    
    res.clearCookie('_r_t');
    res.clearCookie('csrf_token');
    res.clearCookie('csrf-token');
    res.status(201);
    res.send("Log out suucessfullt");   
});

const deleteAccount = asyncHandler(async(req, res) => {

    if(!req?.user?.id || !req?.user?.email) return res.status(401).send("Login to your account first");
    
    if(req.user.email === "test@gmail.com") return res.status(403).send("You can't delete this account");

    const findAccount = await User.findOne({ _id: req.user.id });

    if(!findAccount) return res.status(404).send("No Account found!");

    if(findAccount.email !== req.user.email) return res.status(403).send("Login to your account"); 

    const deletedAccount = await User.deleteOne({ _id: req.user.id });

    if(!deletedAccount || deletedAccount.deleteCount <= 0) return res.status(501).send("Error in our side, please try again later");

    const deletedProfile = await Profile.deleteOne({ email: req.user.email });

    const preDeletePosts = await Post.find({ creator_id: req.user.id });

    const deletedPosts = await Post.deleteMany({ creator_id: req.user.id });

    let postsArr = [];
    let deletedPicsNames = [];
    for (let i = 0; i < preDeletePosts.length; i++) {
        if(preDeletePosts[i]._id) {
            postsArr.push(preDeletePosts[i]._id);
            console.log(preDeletePosts[i].post_images);
            if(Array.isArray(preDeletePosts[i].post_images))
                for (let j = 0; j < postToDelete.post_images.length; j++) {
                    deletedPicsNames.push(preDeletePosts[i].post_images[j].picturesNames);
                }  
                console.log("deleted pictures names: ", deletedPicsNames);  
        }
    };

    const deletedComments = await Comment.deleteMany({ post_id: postsArr });

    const deletedWL = await WL.deleteOne({ email: req.user.email });

    const deletedVerCodes = await VerCode.deleteOne({ email: req.user.email });

    const deletedChats = await Chat.deleteMany({ $or: [{sender_id: req.user.id}, {receiver_id: req.user.id}] });

    const deletedContacts = await Contact.deleteMany({ $or: [{user_id: req.user.id}, {contact_id: req.user.id}] });

    logDeletedPic(deletedPicsNames);    

    res.clearCookie('_a_t');    
    res.clearCookie('_r_t');
    res.status(200);
    res.send("your Account deleted suucessfully");   
});

const getUserInfo = asyncHandler( async(req, res) => {
    
    if(!req || !req.user || !req.user.id || !req.user.username) return res.status(401).send("How did you get here O_O");

    if(!mongoose.Types.ObjectId.isValid(req.user.id)) return res.status(403).send("Not valid inputs");

    res.cookie('csrf_token', req.csrfToken(), {
        httpOnly: true,
        path: "/",
        secure: true,
        sameSite: "None",
        maxAge: 4 * 60 * 60 * 1000
    });

    const profile = await Profile.findOne({user_id: req.user.id});

    if(!profile) return res.status(403).send("please login to your account");

    const user = await User.findOne({ _id: req.user.id });

    const role = user.is_owner_role ? "owner" : (user.is_admin_role ? "admin" : "user");

    res.status(200).json({
        user_id: req.user.id, 
        user_username: req.user.username, 
        profile_image: profile.profileImage,
        tokenExp: req.token_exp,
        role
    });
});

const changePasswordEmailCode = asyncHandler( async(req, res) => {

    if(!req?.body) return res.status(404).send("Error in request");

    const { email } = req.body;

    if(!email || email.length <= 0 || !isValidEmail(email)) return res.status(403).send("No email found");

    if(email === "test@gmail.com") return res.status(403).send("You can't change test account password");
    
    /* check email availability */
    const emailAvailable = await User.findOne({email: email});
    if(!emailAvailable)
        return res.status(403).send("Enter valid email :)");

    const code = generateRandomCode();

    console.log("Verification Code: ", code);

    const sendEmailRes = await sendToEmail(code, email, process.env.GMAIL_ACCOUNT, process.env.GMAIL_APP_PASSWORD);

    if(!sendEmailRes || sendEmailRes === false) return res.status(501).send("We encountered an error when sending the code please try again later");

    const verCodeRes = await VerCode.findOneAndUpdate({ email: email }, { code: code, date: Date.now() });

    if(!verCodeRes) return res.status(501).send("Error in our server please try again later");

    res.status(200).send("Code sent successfully to your email");

});

const changePassword = asyncHandler( async(req, res) => {

    if(!req?.body) return res.status(403).send("Error in the request");

    const { email, newPassword, eCode } = req.body;

    if(!email || !isValidEmail(email) 
        || !isValidText(eCode) || eCode.length !== 6 
        || !isValidPassword(newPassword) || newPassword.length < 8) return res.status(403).send("invalid inputs");

    const verCode = await VerCode.findOne({ email: email, code: eCode });

    if(!verCode || !verCode.date) return res.status(400).send("Send code first");

    console.log("Checking if code expired (> 1 hour): ", Date.now(), " - ", verCode.date, " = ", Date.now() - verCode.date);

    if(Date.now() - verCode.date > (60 * 60 * 1000)) return res.status(403).send("please re send code");

    /* hash the password */
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate({ email: email }, { password: hashedPassword });

    if(!user) return res.status(501).send("please try again");

    await VerCode.findOneAndUpdate({ email: email }, { code: null, date: null, verified: true });

    res.status(200).send("Successfully verified your Email :)");

});

module.exports = {
    registerUser, logUser, logOut, getUserInfo, 
    sendCodeToEmail, verifyEmail, deleteAccount,
    changePasswordEmailCode, changePassword,
    csrfProtection
};