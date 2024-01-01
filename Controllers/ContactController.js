const asyncHandler = require('express-async-handler');
const Contact = require('../Data/ContactModel');
const Profile = require('../Data/ProfileModel');
const { default: mongoose } = require('mongoose');

const createContact = asyncHandler( async(req, res) => {

    if(!req?.params?.id || !req?.user?.id) return res.status(404).send("Login to your account");

    const userID = req.user.id;

    const contact_id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(contact_id) || !mongoose.Types.ObjectId.isValid(userID))
        return res.status(400).send("Error in your request");

    const contact = await Contact.findOne({ user_id: userID, contact_id: contact_id });

    if(!contact){

        const contactProfile = await Profile.findOne({ user_id: contact_id });
        
        console.log("contactProfile: ", contactProfile);

        const contact_profilePicName = contactProfile.profileImage;

        const createdContact = await Contact.create({
            user_id: userID,
            contact_id: contact_id,
            contact_image: contact_profilePicName,
            contact_username: contactProfile.username,
            new_messages: 0
        });

        if(!createdContact) return res.status(501).send("Error please try again later");

        res.status(201).json(createContact);    

    };

    return true;
        
});

const getContacts = asyncHandler( async(req, res) => {

    if(!req?.user?.id)
        return res.status(404).json({ message: "invalid request" });

    if(!mongoose.Types.ObjectId.isValid(req.user.id)) return res.status(403).send("login to your account");    

    const user_id = req.user.id;
    
    const contacts = await Contact.find({ user_id: user_id }).sort({ new_messages: -1, updatedAt: -1 });

    if(!contacts || contacts.length <= 0)
        return res.status(404).json({ message: "No contacts found!" });

    res.status(200).json(contacts);

});

const deleteContact = asyncHandler( async(req, res) => {

    if(!req?.params?.id || !req?.user?.id)
        return res.status(404).json({ message: "invalid request" });

    if(!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "error in url" })

    const deletedContact = await Contact.deleteOne({ _id: req.params.id, user_id: req.user.id });

    if(!deletedContact?.deletedCount > 0)
        return res.status(403).json({ message: "Error deleting the contact please try again" });

    res.status(201).json(deletedContact);

}); 

const updateContact = asyncHandler( async(req, res) => {

    if(!req?.params?.id || !req?.user?.id)
        return res.status(404).json({ message: "invalid request" });

    if(!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "error in url" })

    const updatedContact = await Contact.findOneAndUpdate({ user_id: req.user.id, _id: req.params.id }, { new_messages: 0 });

    if(!updatedContact)
        return res.status(403).json({ message: "no cantact found" });

    res.status(200).json(updatedContact);

}); 

module.exports = { createContact, getContacts, deleteContact, updateContact };