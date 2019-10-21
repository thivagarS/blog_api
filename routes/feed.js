const express = require('express');
const { check } = require('express-validator');

const feedController = require('../controllers/feed');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

// GET /feed/posts
router.get('/posts', feedController.getPosts);

// POST /feed/post
router.post('/post', [ 
        check('title')
        .trim()
        .isLength({min: 5}),
        check('content')
        .trim()
        .isLength({min: 5})
    ], isAuth, feedController.postPost);

router.get('/post/:postId', feedController.getPost);

router.delete('/post/:postId', isAuth, feedController.deletePost);

router.put('/post/:postId', isAuth, feedController.updatePost);

module.exports = router;