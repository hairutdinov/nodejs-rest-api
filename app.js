const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')
const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolvers = require('./graphql/resolvers')
const auth = require('./middleware/auth')
const helmet = require('helmet')

require ('dotenv').config()

const mongoose = require('mongoose')
const fs = require("fs")

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
            break
        default:
            callback(null, false)
    }
}

const app = express()

app.use(helmet())

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

app.use(auth)

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        throw new Error('Not authenticated')
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided!' })
    }
    if (req.body.oldPath) {
        clearImage(req.body.oldPath)
    }
    return res.status(201).json({ message: 'File stored.', filePath: req.file.path })
})

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
mongoose.connect(`mongodb+srv://${ process.env.MONGO_USER }:${ process.env.MONGO_PASSWORD }@cluster0.4opfk7m.mongodb.net/${ process.env.MONGO_DEFAULT_DATABASE }?w=majority`)
    .then(r => {
        app.listen(process.env.PORT || 8180)
        console.log('Connected successfully to MongoDB server')
    })
    .catch(e => {
        console.error(e)
    })
    .catch(console.error)

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.error(err))
}