const express = require("express");
const { body } = require("express-validator/check");

const User = require("../models/Users");
const authController = require('../controllers/auth');

const router = express.Router();

router.put('/signup', [
        body('email')
        .isEmail()
        .withMessage("ENter a valid E-mail")
        .custom((value, {req}) => {
            return User.findOne({email: value})
            .then(user => {
                if(user) {
                    return Promise.reject("Email already exists");
                }
            })
        })
        .normalizeEmail(),
        body('password')
        .trim()
        .isLength({ min: 5 }),
        body('name')
        .trim()
        .not()
        .isEmpty()
    ], authController.putSignup);

router.post('/login', authController.postLogin);

module.exports = router;