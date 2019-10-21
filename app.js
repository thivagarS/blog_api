const path = require('path');

const express =  require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
const authRoutes = require("./routes/auth");

const app = express();

const fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        console.log("Reached")
        cb(null, 'images');
    },
    filename: function(req, file, cb){
        cb(null, new Date().toISOString().replace(/:/g, '-') + "_" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
    cb(null, true);
    } else {
    cb(null, false);
    }
};

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

// CORS Headers
app.use((req, res, next) => {
    // '*' for all sites
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});

mongoose.connect('mongodb+srv://thivagar:SJDthiva@619@cluster0-akxsq.mongodb.net/blog?retryWrites=true&w=majority', { useNewUrlParser: true })
.then(res => {
    console.log('Connected to MongoDB...');
    const server = app.listen(8080, () => {
        console.log('App started on port 8080 ...')
    });
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('Client connected');
    });
})
.catch(err => {
    console.log(err);
})
