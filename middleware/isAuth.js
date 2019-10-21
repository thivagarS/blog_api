const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.isAuth = (req, res, next) => {
    const token = req.get('Authorization');
    console.log(token);
    const user = jwt.verify(token, 'secert');
    if(!user) {
        const err = new Error("Not Authorized");
        err.statusCode = 401;
        throw err;
    }
    console.log(user);
    req.userId = user.userId;
    next();
}