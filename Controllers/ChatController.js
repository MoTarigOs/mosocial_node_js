const asyncHandler = require('express-async-handler');
const Chat = require('../Data/ChatModel');
const User = require('../Data/UserModel');
const mongoose = require('mongoose');
const Contact = require('../Data/ContactModel');
const Profile = require('../Data/ProfileModel');
const { escapeHtmlandJS } = require('../Logic/helperMethods');

const sendMessage = asyncHandler( async(req, res) => {

    if(!req?.params?.id || !req?.user?.id)
        return res.status(403).json({ message: "please enter valid inputs" });

     if(!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "error in url" });    

    const { text } = req.body;

    if(req.params.id === req.user.id)
        return res.status(403).json({ message: "can't send to your self" });

    const checkReceiver = await User.findOne({ _id: req.params.id });

    if(!checkReceiver?.username) return res.status(403).json({ message: "no receiver found" });
        
    const chat = await Chat.create({
        sender_id: req.user.id,
        sender_username: req.user.username,
        receiver_id: req.params.id,
        chat_text: escapeHtmlandJS(text)
    });

    if(!chat)
        return res.status(403).json({ message: "Error sending the message" });

    const contact = await Contact.findOneAndUpdate({ user_id: req.params.id, contact_id: req.user.id }, { $inc : {'new_messages' : 1} });

    if(!contact){
        const notif = {
            notif_sender_username: sender_username ? sender_username : req.user.username,
            notif_sender_id: req.user.id
        };

        await Profile.findOneAndUpdate({ user_id: req.params.id }, 
            { $push: {notification: notif }})
    }

    res.status(201).json(chat);    

});

const getChats = asyncHandler( async(req, res) => {

    if(!req?.params?.id || !req?.user?.id)
        return res.status(403).send("please enter valid inputs");

    if(!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(403).send("error in url" );    

    const sender_id = req.user.id;
    const receiver_id = req.params.id;

    if(req.params.id === req.user.id)
        return res.status(403).send("no messages found");
        
    const chats = await Chat.find({ sender_id: [sender_id, receiver_id], receiver_id: [sender_id, receiver_id] }).sort({ createdAt: 1 }).limit(25);

    if(!chats || chats.length <= 0) return res.status(404).send("oops! no messages found");

    res.status(200).json(chats);    

});

const deleteChat = asyncHandler( async(req, res) => {

    if(!req?.params?.message_id || !req?.user?.id)
        return res.status(403).json({ message: "please enter valid inputs" });

    if(!mongoose.Types.ObjectId.isValid(req.params.message_id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "Error in url" });    

    const sender_id = req.user.id;
    const message_id = req.params.message_id;
 
    const deletedChat = await Chat.deleteOne({ _id: message_id, sender_id: sender_id });
    
    if(!deletedChat?.deletedCount > 0)
        return res.status(403).json({ message: "Error deleting message" });
        
    res.status(200).json(deletedChat);    

});

module.exports = { sendMessage, getChats, deleteChat };