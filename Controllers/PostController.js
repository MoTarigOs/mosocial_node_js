const asyncHandler = require('express-async-handler');
const Post = require('../Data/PostModel');
const Profile = require('../Data/ProfileModel');
const AdminActivity = require('../Data/AdminActivityModel');
const { isValidUsername, isValidText } = require('../Logic/Checker');
const mongoose = require('mongoose');
const ContactModel = require('../Data/ContactModel');
const B2 = require('backblaze-b2');
const { logDeletedPic, escapeHtmlandJS } = require('../Logic/helperMethods');

const createPost = asyncHandler(async (req, res) => {

    if(!req?.body || !req?.user?.id) return res.sendStatus(403);

    if(!mongoose.Types.ObjectId.isValid(req.user.id)) return res.status(403).send("not valid info");
        
    const creator_id = req.user.id;

    const { post_images_names, creator_image, desc } = req.body;

    if(typeof creator_image !== "string" || typeof desc !== "string") return res.status(400).send("Not valid inputs");
 
    for (let i = 0; i < post_images_names.length; i++) {
        if(typeof post_images_names[i].picturesNames !== "string") return res.status(400).send("Not valid inputs");
            post_images_names[i].picturesNames = escapeHtmlandJS(post_images_names[i].picturesNames);
    };

    const post = await Post.create({
        creator_image: creator_image ? escapeHtmlandJS(creator_image) : "",
        creator_id: creator_id,
        creator_username: req.user.username,
        post_images: post_images_names,
        desc: desc,
        likes: 0,
        dislikes: 0
    });
    
    if(!post) return res.status(501).send("Error publishing the post");

    let uploadUrl = "";
    let authToken = "";

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

    const returnThis = {
        postId: post._id,
        uploadUrl: uploadUrl,
        authToken: authToken,
        picturesNames: post_images_names
    };

    res.status(201).json(returnThis);

});

const getAllPostsByID = asyncHandler( async(req, res) => {

    if(!req?.params?.id)
        return res.sendStatus(404);

    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(403).send("No user selected");    

    const userID = req.params.id;

    let { limit, filter } = req.params ? req.params : {limit: null, filter: null};
    
    if(!limit) limit = 10;
    
    if(!filter) filter = "newest";

    limit = Number(limit);

    let posts = [];

    switch(filter){
        case "newest":
            posts = await Post.find({ creator_id: userID }).sort({ createdAt: -1 }).limit(limit);
            break;    
        case "oldest":
            posts = await Post.find({ creator_id: userID }).sort({ createdAt: 1 }).limit(limit);
            break;    
        default:
            posts = await Post.find({ creator_id: userID }).sort({ createdAt: -1 }).limit(limit);
            break;    
    }
    
    if(!posts)
        return res.status(404).json({ message: "no posts to show" });

    if(mongoose.Types.ObjectId.isValid(req.user.id)){
        const profile = await Profile.findOne({ user_id: req.user.id });
        if(profile && profile.postsLiked) 
            return res.status(200).json({posts: posts, likedPosts: profile.postsLiked});
    }    

    res.status(200).json({posts: posts, likedPosts: []});    
});

const getPosts = asyncHandler( async(req, res) => {

    if(!req) return res.status(404).send("no request found please refresh the page");

    let { limit, filter, contactsFilter, filterText } = req.params ? req.params : {limit: 5, filter: "", contactsFilter: ""};

    console.log("get posts: ", filter, filterText, contactsFilter);

    if(!isValidText(filter) || !isValidText(filterText) || !isValidText(contactsFilter)) 
        return res.status(400).send("Not valid inputs");
    
    if(!limit || typeof limit !== "number" || limit <= 5) limit = 10;

    if(limit > 50) limit = 50;
    
    if(!filter || filter.length <= 0) filter = "Date of publish";

    let contactsFilterArray = [];
    const checkFilter = filter.split("-");
    let isContact = false;
    for (let i = 0; i < checkFilter.length; i++) {
        if(checkFilter[i] === "Contacts") isContact = true;
    }
    if(isContact === true){
        contactsFilter = contactsFilter ? contactsFilter.split("-") : null;
        if(((!contactsFilter || contactsFilter.length <= 0 || !mongoose.Types.ObjectId.isValid(contactsFilter[0])) && req.user.id)){
            const myContacts = await ContactModel.find({ user_id: req.user.id });
            for (let i = 0; i < myContacts.length; i++) {
                contactsFilterArray.push(myContacts[i].contact_id.toString());
            }
        } else if(contactsFilter && contactsFilter.length > 0){
            for (let i = 0; i < contactsFilter.length; i++) {
                if(mongoose.Types.ObjectId.isValid(contactsFilter[i])){
                    contactsFilterArray.push(contactsFilter[i]);
                }
            }
        }
    }

    let posts = [];

    switch(filter){
        case "Date-of-publish":
            posts = await Post.find().sort({ createdAt: -1 }).limit(limit);
            break;    
        case "My-Contacts-Only-Date-of-publish":
            posts = await Post.find({ creator_id: contactsFilterArray }).sort({ createdAt: -1 }).limit(limit);
            break;    
        case "Most-Liked-Posts":
            posts = await Post.find().sort({ likes: -1 }).limit(limit);
            break;    
        case "My-Contacts-Only-Most-Liked-Posts":
            if(contactsFilterArray.length <= 0) break;
            posts = await Post.find({ creator_id: contactsFilterArray }).sort({ likes: -1 }).limit(limit);
            break;    
        case "Search-By-Text-Date-of-publish":
            posts = await Post.find({ $text: {$search: filterText} }).limit(limit);
            break;    
        case "Search-By-Text-Most-Liked-Posts":
            posts = await Post.find({ $text: {$search: filterText} }).sort({ likes: -1 }).limit(limit);
            break;    
        case "Search-By-Text-My-Contacts-Only-Date-of-publish":
            posts = await Post.find({ $text: {$search: filterText}, creator_id: contactsFilterArray }).limit(limit);
            break;    
        case "Search-By-Text-My-Contacts-Only-Most-Liked-Posts":
            posts = await Post.find({ $text: {$search: filterText}, creator_id: contactsFilterArray }).sort({ likes: -1 }).limit(limit);
            break;    
        default:
            posts = await Post.find().sort({ createdAt: -1 }).limit(limit);
            break;    
    }    

    if(!posts) return res.sendStatus(404);

    if(posts.length <= 0) return res.status(200).send("No posts found");

    if(req?.user?.email){
        const profile = await Profile.findOne({ email: req.user.email });
        if(profile && profile.postsLiked){
            return res.status(200).json({posts: posts, likedPosts: profile.postsLiked});
        }
    }    

    res.status(200).json({posts: posts, likedPosts: null});;    

});

const likePost = asyncHandler( async(req, res) => {
    if(!req?.params?.id)
        return res.status(404).json({ message: "please enter valid info" });

    if(!req.user?.id)
        return res.status(403).json({ message: "something went wrong please login again" });

    if(!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "error in url" })

    const post_id = req.params.id;

    const checkLikedPosts = await Profile.findOne({ user_id: req.user.id });

    if(!checkLikedPosts) return res.status(404).send("Post not found");

    const likedPosts = checkLikedPosts.postsLiked;

    if(likedPosts){
        for(let i = 0; i < likedPosts.length; i++){
            if(likedPosts[i]?.post_liked_id){
                if(likedPosts[i].post_liked_id === post_id)
                    return res.status(403).json({ message: "you already liked this post" });
            }
        }
    };
    
    const updatePostLikes = await Post.findOneAndUpdate({ _id: post_id }, { $inc : {'likes' : 1}});

    if(!updatePostLikes)
        return res.status(404).json({ message: "please enter valid info" });

    const newLikeList = [...likedPosts, {post_liked_id: post_id}];   

    const updateProfile = await Profile.findOneAndUpdate({ user_id: req.user.id }, { postsLiked: newLikeList });

    if(!updateProfile)
        return res.status(201).json({ message: "please re-like the post" });

    res.status(201).json(updatePostLikes);    
});

const removeLikePost = asyncHandler( async(req, res) => {
    
    if(!req?.params?.id)
        return res.status(400).json({ message: "please enter valid info" });

    if(!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(400).json({ message: "error in url" })

    const post_id = req.params.id;

    const checkLikedPosts = await Profile.findOne({ user_id: req.user.id }).select;

    if(!checkLikedPosts) return res.status(404).send("Post not found");

    const likedPosts = checkLikedPosts.postsLiked;

    let exist = false;

    if(likedPosts){
        for(let i = 0; i < likedPosts.length; i++){
            if(likedPosts[i]?.post_liked_id){
                if(likedPosts[i].post_liked_id === post_id){
                    likedPosts.splice(i, 1);
                    exist = true;
                }
            }
        }

        if(!exist)
            return res.status(403).json({ message: "You haven't liked this post" });

    } else {
        return res.status(403).json({ message: "You haven't liked this post" });
    }
    
    const updatePostLikes = await Post.findOneAndUpdate({ _id: post_id }, { $inc : {'likes' : -1}});

    if(!updatePostLikes)
        return res.status(404).json({ message: "please enter valid info" });

    const updateProfile = await Profile.findOneAndUpdate({ email: req.user.email }, { postsLiked: likedPosts });

    if(!updateProfile)
        return res.status(201).json({ message: "please re-take like the post" });

    res.status(201).json(updatePostLikes);    
});

const deletePost = asyncHandler( async(req, res) => {

    if(!req?.params?.post_id || !req?.user?.id)
        return res.status(403).json({ message: "error in the url" })

    if(!mongoose.Types.ObjectId.isValid(req.params.post_id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "error in url" })

    const postToDelete = await Post.findOne({ _id: req.params.post_id });

    if(!postToDelete?.creator_id) return res.status(404).json({ message: "no post found" });

    if(postToDelete.creator_id.toString() !== req.user.id)
        return res.status(403).json({ message: "you are not allowed to delete this post" });

    const deletedPost = await Post.deleteOne({ _id: req.params.post_id })   
    
    if(deletedPost.deletedCount <= 0)
        return res.status(501).json({ message: "Error deleting post" });

    if(!postToDelete.post_images || postToDelete.post_images.length <= 0) return res.status(200).json(deletedPost);    

    let deletedPicsNames = [];
    for (let i = 0; i < postToDelete.post_images.length; i++) {
        if(postToDelete.post_images[i].picturesNames) deletedPicsNames.push(postToDelete.post_images[i].picturesNames);
    }    

    logDeletedPic(deletedPicsNames);    

    res.status(200).json(deletedPost);

});

const getPostDetails = asyncHandler( async(req, res) => {

    if(!req?.params?.post_id) return res.status(404).json({ message: "no post found" })

    if(!mongoose.Types.ObjectId.isValid(req.params.post_id)) return res.status(404).json({ message: "error in url" })

    const post = await Post.findOne({ _id: req.params.post_id });

    if(!post) return res.status(404).send("No post found");

    if(req.user?.id){
        const profile = await Profile.findOne({ user_id: req.user.id });
        console.log("get post details: ", post, profile.postsLiked);
        return res.status(200).json({postDetails: post, likedPosts: profile.postsLiked});
    }

    res.status(200).json({postDetails: post, likedPosts: null});

});

module.exports = { createPost, getAllPostsByID, getPosts, likePost, removeLikePost, deletePost, getPostDetails };