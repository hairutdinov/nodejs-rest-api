const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')
const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolvers = require('./graphql/resolvers')
const auth = require('./middleware/auth');

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
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
})

app.use(auth);

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    customFormatErrorFn: err => {
        if (!err.originalError) {
            return err
        }
        const data = err.originalError.data
        const message = err.originalError.message || 'An error occurred.'
        const statusCode = err.originalError.statusCode || 500
        return {
            message,
            status: statusCode,
            data,
        }
    }
}))

app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        message: error.message,
        data: error.data
    })
})

mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGO_CONNECTION_URI)
    .then(r => {
        app.listen(8180)
        console.log('Connected successfully to MongoDB server')
    })
    .catch(e => {
        console.error(e)
    })
    .catch(console.error)

