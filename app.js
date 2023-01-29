const express = require('express')
const feedRouter = require('./routes/feed')
const bodyParser = require('body-parser')


const app = express()

// app.use(bodyParser.urlencoded()) // x-www-form-encoded <form>
app.use(bodyParser.json()) // application/json

app.use('/feed', feedRouter)

app.listen(8180)