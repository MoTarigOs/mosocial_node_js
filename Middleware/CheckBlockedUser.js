const asyncHandler = require('express-async-handler');
const User = require('../Data/UserModel');
const Admin = require('../Data/AdminModel');
const { default: mongoose } = require('mongoose');

const checkBlockedUsers = asyncHandler(async(req, res, next) => {

    if(!req || !req.user) return res.status(403).send("please login to your account");

    const { id } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(403).send("wrong inputs");

    const user = await User.findOne({ _id: id });

    if(user.isBlocked){

        const elabsed = Date.now() - user.blocked.date_of_block;

        if(elabsed <= user.blocked.block_duration) 
            return res.status(403).send(`you are blocked come back after ${Math.round((user.blocked.block_duration - elabsed)/1000/60/60/24)} days`);
    
        const blockObj = {
            date_of_block: null,
            block_duration: null
        };

        const updateBlockedUser = await User.findOneAndUpdate({ _id: id }, { blocked: blockObj, isBlocked: false });

        if(!updateBlockedUser) return res.status(501).send("please try login again");

        const obj = {blocked_user_id: user._id};

        await Admin.update({ blocked_users_ids: obj }, { $pull: { blocked_users_ids: obj } });
        
    };

    next();

});

module.exports = checkBlockedUsers;