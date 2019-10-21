const fs  = require("fs");
const path = require("path");

const { getIO } = require("../socket");

const { validationResult } = require('express-validator');

const Post = require('../models/Post');
const User = require('../models/Users');

exports.getPosts = (req, res, next) => {
    let totalItems = 0;
    const page = req.query.page || 1;
    const feedPerPage = 2;
    Post.find()
    .countDocuments()
    .then(count => { 
        totalItems = count;
        return Post.find().populate('creator').skip((page - 1) * feedPerPage).limit(feedPerPage)
    })
    .then(posts => {  
        res.status(200).json({
            message: "Post fetched successfully",
            posts,
            totalItems: totalItems
        })
    })
    .catch(err => {
        if(!err.statusCode)
            err.statusCode = 500;
        next(err);
    })
};

exports.postPost = (req, res, next) => {
    const errors = validationResult(req);
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\", "/");
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const newPost = new Post({
        title,
        content,
        imageUrl,
        creator: req.userId
    });
    let creator;
    let createdPost;
    newPost.save()
    .then(post => {
        console.log(`New Post: ${newPost}`);
        console.log('Post ' + post);
        createdPost = post;
        return User.findById(req.userId)
    })
    .then(user => {
        creator = user;
        console.log(req.userId);
        console.log(user);
        user.posts.push(createdPost._id);
        return user.save();
    })
    .then(user => {
        getIO().emit('posts', {
            action: 'create',
            post: {
                ...createdPost._doc,
                creator: {
                    name: creator.name,
                    _id: creator._id
                }
            }
        })
        res.status(201).json({
            message: 'Post created successfully',
            post: createdPost,
            creator: {
                name: creator.name
            }
        });
    })
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if (!post) {
          const error = new Error('Could not find post.');
          error.statusCode = 404;
          throw error; 
        }
        res.status(200).json({ message: 'Post fetched.', post: post });
    })
    .catch(err => {
        console.log(err);
        if(!err.statusCode)
            err.statusCode = 500;
        next(err);
    })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if(!post) {
            const err = new Error (" COunt not find the post");
            err.statusCode = 404;
            throw err;
        } 
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId)
    })
    .then(result => {
        return User.findById(req.userId)
    })
    .then(user => {
        user.posts.pull(postId);
        return user.save();
    })
    .then(user => {
        getIO().emit('posts', { action: 'delete', post: postId });
        res.status(200).json({message: "Deleted Successfully"});
    })
    .catch(err => {
        if(!err.statusCode)
            err.statusCode = 500;
        next(err);
    })
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file)
        imageUrl = req.file.path.replace("\\", "/");
    if(!imageUrl) {
        const err = new Error('Pick a file');
        err.statusCode(422);
        throw err;
    }
    Post.findById(postId)
    .then(post => {
        if(!post) {
            const err = new Error("No Post found");
            err.statusCode = 404;
            throw err;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }
        if(req.file)
            clearImage(post.imageUrl);
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        return post.save()
    })
    .then(post => {
        getIO().emit('posts', { action: 'update', post });
        res.status(200).json({
            message: "Updated Successfully",
            post: post
        })
    })
    .catch(err => {
        if(!err.statusCode)
            err.statusCode = 500;
        next(err);
    })
};

const clearImage = filePath => {
    filePath = path.join(__dirname , "..", filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    })
}