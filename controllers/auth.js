const User = require("../models/Users");

const jwt = require("jsonwebtoken");
const bycrpt = require("bcryptjs");
const { validationResult } = require("express-validator");

exports.putSignup = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const err = new Error("Validation failed");
        err.data = errors.array();
        err.statusCode = 422;
        throw err;
    }
    bycrpt.hash(password, 12)
    .then(hashedPassword => {
        const newUser = new User({
            email,
            name,
            password : hashedPassword
        })
        return newUser.save()
    })
    .then(user => {
        res.status(201).json({ message: 'User created!', userId: user._id });
    })
    .catch(err => {
        console.log(err);
        if(!err.statusCode)
            err.statusCode = 500;
        next(err);
    })
}

exports.postLogin = (req, res, next) => {
    const { email, password} = req.body;
    let loadedUser ;
    User.findOne({email})
    .then(user => {
        if(!user) {
            const err = new Error("Invalid User name or password");
            err.statusCode = 401;
            throw err;
        }
        loadedUser = user;
        return bycrpt.compare(password, user.password)
    })
    .then(isEqual => {
        if(!isEqual) {
            const err = new Error("Invalida user name or password");
            err.statusCode = 401;
            throw err;
        }
        const token = jwt.sign(
            {
                email: loadedUser.email, 
                userId: loadedUser._id.toString()
            }, 'secert', {
                expiresIn: '1h'
            })
        console.log(token);
        res.status(200).json({token: token, userId: loadedUser._id.toString()});
    })
    .catch(err => {
        console.log(err);
        if(!err.statusCode)
            err.statusCode = 500;
        next(err)
    })
}