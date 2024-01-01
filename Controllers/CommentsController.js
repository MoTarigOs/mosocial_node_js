const asyncHandler = require('express-async-handler');
const Comment = require('../Data/CommentModel');
const Post = require('../Data/PostModel');
const mongoose = require('mongoose');
const { escapeHtmlandJS } = require('../Logic/helperMethods');

const createComment = asyncHandler( async(req, res) => {

    if(!req?.body || !req?.params?.post_id || !req?.user?.id)
        return res.status(404).json({ message: "error in inputs" });

    if(!mongoose.Types.ObjectId.isValid(req.params.post_id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(400).send("Don't manipulate ids :(");    

    const { commenter_image, comment_text } = req.body;

    const comment = await Comment.create({
        post_id: req.params.post_id,
        commenter_id: req.user.id,
        commenter_image: commenter_image ? escapeHtmlandJS(commenter_image) : "",
        commenter_name: req.user.username,
        comment_text: escapeHtmlandJS(comment_text)
    });
    
    if(!comment)
        return res.status(404).json({message: "oops! try again" });

    res.status(201).send(comment);

});

const deleteComment = asyncHandler( async(req, res) => {

    if(!req?.params?.comment_id || !req?.user?.id)
        return res.status(404).json({ message: "error in url" })

    if(!mongoose.Types.ObjectId.isValid(req.params.comment_id) || !mongoose.Types.ObjectId.isValid(req.user.id))
        return res.status(404).json({ message: "error in url" })
        
    const commentToDelete = await Comment.findOne({_id: req.params.comment_id});    

    if(!commentToDelete)
        return res.status(404).json({ message: "comment not found" });

    if(commentToDelete.commenter_id.toString() !== req.user.id)
        return res.status(403).json({ message: "oops, you are not able to delete this comment" })   
        
    const deletedComment = await Comment.deleteOne({_id: req.params.comment_id});

    if(deletedComment?.deletedCount !== 1)
        return res.status(403).json({ message: "oops, error deleting comment" });

    res.status(200).json(deletedComment);

});

const getComments = asyncHandler( async(req, res) => {

    if(!req?.params?.post_id)
        return res.status(403).json({ message: "error in url" });

    if(!mongoose.Types.ObjectId.isValid(req.params.post_id))
        return res.status(404).json({ message: "error in url" });

    let { limit } = req.params ? req.params : {limit: null};   
    
    if(!limit || limit === 0) limit = 12;

    limit = Number(limit);

    const comments = await Comment.find({post_id: req.params.post_id}).sort({ createdAt: -1 }).limit(limit);

    if(!comments)
        return res.status(404).json({ message: "not found" });

    res.status(200).json(comments);  

});

const getComment = asyncHandler( async(req, res) => {

    if(!req?.params)
        return res.status(403).json({ message: "error in url" });

    const { comment_id } = req.params;    

    if(!comment_id || !mongoose.Types.ObjectId.isValid(comment_id))
        return res.status(404).json({ message: "error in url" });

    const comment = await Comment.findOne({ _id: comment_id });

    if(!comment)
        return res.status(404).json({ message: "not found" });

    res.status(200).json(comment);  

});

const getTopComment = asyncHandler( async(req, res) => {

    if(!req?.params?.post_id) return res.status(403).json({ message: "Error in your request" });

    if(!mongoose.Types.ObjectId.isValid(req.params.post_id)) return res.status(403).send("Please refresh the page");

    const comment = await Comment.findOne({post_id: req.params.post_id}).sort({ createdAt: -1 });

    if(!comment) return res.status(404).json({ message: "no comment found" });

    res.status(200).json(comment);  

});

const getRandomComments = asyncHandler( async(req, res) => {

    if(!req?.user?.id) return res.status(400).json({ message: "error" });

    if(!mongoose.Types.ObjectId.isValid(req.user.id)) return res.status(403).send("Error in your info please login again");    

    const posts = await Post.find({creator_id: req.user.id});

    if(!posts) return res.status(404).json({ message: "no comments neither posts" });

    let postsArray = [];
    
    for(let i = 0; i < posts.length; i++){
        if(posts[i]?._id)
            postsArray.push(posts[i]._id);
    };

    if(postsArray.length <= 0) return res.status(404).json({ message: "no posts found neither comments" });

    let numOfFetches = 1;
    if(req.params && req.params.num_of_fetches && req.params.num_of_fetches > 0 && req.params.num_of_fetches < 10)
        numOfFetches = req.params.num_of_fetches;

    const comments = await Comment.find({post_id: postsArray}).sort({ createdAt: -1 }).limit(numOfFetches * 10);

    if(!comments) return res.status(404).json({ message: "no comments found" });

    res.status(200).json({comments: comments, posts: posts});
});

module.exports = { createComment, deleteComment, getComments, getComment, getTopComment, getRandomComments };