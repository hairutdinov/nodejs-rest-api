const express = require('express')
const feedRouter = require('./routes/feed')
const bodyParser = require('body-parser')

require ('dotenv').config()

const mongoose = require('mongoose')

const app = express()

// app.use(bodyParser.urlencoded()) // x-www-form-encoded <form>
app.use(bodyParser.json()) // application/json

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use('/feed', feedRouter)

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

