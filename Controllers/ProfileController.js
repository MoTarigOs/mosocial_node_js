const asyncHandler = require('express-async-handler');
const Profile = require('../Data/ProfileModel');
const User = require('../Data/UserModel');
const { isValidUsername, isSecuredContact } = require('../Logic/Checker');
const { logDeletedPic, escapeHtmlandJS } = require('../Logic/helperMethods');
const mongoose = require('mongoose');
const B2 = require('backblaze-b2');


const updateProfile = asyncHandler( async (req, res) => {

    if(!req?.body || !req?.user?.id)
        return res.status(401).json({message: "please enter valid infos"})

    const {
        username, introParagraph, smallDetails, paragraph, skills, contacts, picName
    } = req.body;   

    const userID = req.user.id;

    if(!userID || !mongoose.Types.ObjectId.isValid(userID))
        return res.status(401).json({message: "please login to your account"});

    if(username){
        if(!isValidUsername(username))
            return res.status(402).json({message: "This username is already taken"});
    };

    if(introParagraph && typeof introParagraph !== 'string')
        return res.status(400).send("Not valid short description");

    if(paragraph && typeof paragraph !== "string") return res.status(400).send("Not valid paragraph text");
    
    if(picName && typeof picName !== "string") return res.status(400).send("Not valid profile picture name");

    for (let i = 0; i < smallDetails.length; i++) {
        if(typeof smallDetails[i].title !== "string" || typeof smallDetails[i].value !== "string")
            return res.status(400).send("Not valid details");     

        smallDetails[i].title = escapeHtmlandJS(smallDetails[i].title);
        smallDetails[i].value = escapeHtmlandJS(smallDetails[i].value);    
    };

    for (let i = 0; i < skills.length; i++) {
        if(typeof skills[i].name !== "string" || typeof skills[i].percentage !== "number")
            return res.status(400).send("Not valid skills");      
            
        skills[i].name = escapeHtmlandJS(skills[i].name);
    };
    
    if(contacts.length > 0){
        for (let i = 0; i < contacts.length; i++) {
            if(!isSecuredContact(contacts[i].name_of_app, contacts[i].url))
                delete contacts[i];
            
            contacts[i].name_of_app = escapeHtmlandJS(contacts[i].name_of_app);    
            contacts[i].url = escapeHtmlandJS(contacts[i].url);    
        };
    }

    const profile = await Profile.findOneAndUpdate({user_id: userID},
        {
            username: username,
            introInfo: {
                introParagraph: escapeHtmlandJS(introParagraph),
                smallDetails: smallDetails
            },
            detailedInfo: {
                paragraph: escapeHtmlandJS(paragraph),
                skills: skills
            },
            contacts: contacts,
            profileImage: escapeHtmlandJS(picName)
        });   

    let uploadUrl = "";
    let authToken = "";

    if(picName && picName.length > 0) {

        const b2 = new B2({
            applicationKeyId: process.env.BACKBLAZE_KEY_ID,
            applicationKey: process.env.BACKBLAZE_APP_KEY,
        });

        const { data: authData } = await b2.authorize();
        const { data: uploadData } = await b2.getUploadUrl({
            Authorization: authData.authorizationToken,
            bucketId: process.env.BACKBLAZE_BUCKET_ID
        });

        uploadUrl = uploadData.uploadUrl;
        authToken = uploadData.authorizationToken;

        logDeletedPic([profile.profileImage]);
        
    };

    if(!profile){
        if(!req.user.username || !mongoose.Types.ObjectId.isValid(userID))
            return res.status(403).json({message: "please login to your account"})

        const username = req.user.username;    
        
        const createdProfile = await Profile.create({
            email: req.user.email,
            username: username,
            user_id: userID,
            postsLiked: [],
            introInfo: {
                introParagraph: introParagraph,
                smallDetails: smallDetails ? smallDetails : []
            },
            detailedInfo: {
                paragraph: paragraph,
                skills: skills ? skills : []
            },
            contacts: contacts,
            profileImage: picName,
            notification: []
        });

        if(!createdProfile) return res.status(404).json({message: "Something gone wrong, please resend your req"});

        const returnProfile = {
            email: req.user.email,
            username: username,
            user_id: creator._id,
            postsLiked: [],
            introInfo: {
                introParagraph: introParagraph,
                smallDetails: smallDetails
            },
            detailedInfo: {
                paragraph: paragraph,
                skills: skills
            },
            contacts: contacts,
            notification: [],
            uploadUrl: uploadUrl,
            authToken: authToken,
            picName: picName
        };
    
        return res.status(201).json(returnProfile);  
            
    };

    const updateUsername = await User.findOneAndUpdate({_id: userID}, {username: username});
    
    if(!updateUsername) return res.status(501).send("Error updating your username please try again");
        
    const returnProfile = {
        username: username,
        introInfo: {
            introParagraph: introParagraph,
            smallDetails: smallDetails
        },
        detailedInfo: {
            paragraph: paragraph,
            skills: skills
        },
        contacts: contacts,
        uploadUrl: uploadUrl,
        authToken: authToken,
        picName: picName
    }

    return res.status(201).json(returnProfile);  

});

const getProfile = asyncHandler( async(req, res) => {

    if(!req?.params?.user_id) return res.status(404).json({message: "Not able to found the user"});

    if(!mongoose.Types.ObjectId.isValid(req.params.user_id)) return res.status(404).send("invalid user id");

    const profile = await Profile.findOne({user_id: req.params.user_id})    

    if(!profile) return res.status(404).json({message: "user not found"})
    
    res.status(200).json({
        profileOwnerId: profile.user_id,
        profileId: profile._id,
        profileImageName: profile.profileImage,    
        username: profile.username,
        introParagraph: profile.introInfo.introParagraph,
        smallDetails: profile.introInfo.smallDetails,
        paragraph: profile.detailedInfo.paragraph,
        skills: profile.detailedInfo.skills,
        contacts: profile.contacts
    });
        
});

const getMyProfile = asyncHandler( async(req, res) => {

    if(!req?.user?.id)
        return res.status(404).json({message: "Not able to found the user"});

    const profile = await Profile.findOne({user_id: req.user.id})    
    if(!profile)
        return res.status(404).json({message: "user not found"})
    
    res.status(200).json({
        profileImageName: profile.profileImage,    
        username: profile.username,
        introParagraph: profile.introInfo.introParagraph,
        smallDetails: profile.introInfo.smallDetails,
        paragraph: profile.detailedInfo.paragraph,
        skills: profile.detailedInfo.skills,
        contacts: profile.contacts,
        notification: profile.notification ? profile.notification : []
    });   
        
});

const clearNotification = asyncHandler( async(req, res) => {

    if(!req?.user?.id) return res.status(403).send("Error in your browser, please login again");

    const updatedProfile = await Profile.findOneAndUpdate({ user_id: req.user.id }, { notification: [] });

    if(!updatedProfile) return res.status(404).send("no profile found");

    res.status(200).send("notification cleared successfully");

});

const updateProfileFailedPic = asyncHandler( async(req, res) => {

    if(!req?.user?.id) return res.status(403).send("please login again");

    const updatedProfile = await Profile.findOneAndUpdate({ user_id: req.user.id }, { profileImage: "" });

    if(!updatedProfile) return res.status(501).send("Simple error occured");

    res.status(200).send("Succeeded");

});

module.exports = { 
    updateProfile, getProfile, getMyProfile, clearNotification, updateProfileFailedPic
 };