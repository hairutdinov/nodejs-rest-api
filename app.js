const express = require('express')
const feedRouter = require('./routes/feed')
const authRouter = require('./routes/auth')
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')

require ('dotenv').config()

const mongoose = require('mongoose')

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images')
    },
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const uniqueSuffix = new Date().toISOString()
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
})

const fileFilter = (req, file, callback) => {
    switch (file.mimetype) {
        case 'image/png':
        case 'image/jpg':
        case 'image/jpeg':
            callback(null, true)
            break;
        default:
            callback(null, false)
    }
}

const app = express()

// app.use(bodyParser.urlencoded()) // x-www-form-encoded <form>
app.use(bodyParser.json()) // application/json
app.use(multer({ storage: fileStorage, fileFilter }).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use('/feed', feedRouter)
app.use('/auth', authRouter)

app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        message: error.message,
        data: error.data
    })
})

mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGO_CONNECTION_URI)
    .then(r => {
        console.log('Connected successfully to MongoDB server');
        app.listen(8180)
    })
    .catch(e => {
        console.error(e)
    })
    .catch(console.error)

