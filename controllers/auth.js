const { validationResult } = require('express-validator')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!')
        error.statusCode = 422
        error.data = errors.array()
        throw error
    }
    const { email, name, password } = req.body
    bcrypt.hash(password, 12)
        .then(hashedPwd => {
            const user = new User({
                email,
                name,
                password: hashedPwd,
            })
            return user.save()
        })
        .then(r => {
            res.status(201).json({
                message: 'User created!',
                userId: r._id
            })
        })
        .catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        })
}

exports.login = (req, res, next) => {
    const { email, password } = req.body
    let loadedUser
    User.findOne({ email })
        .then(u => {
            if (!u) {
                const error = new Error('A user with this email could not be found.')
                error.statusCode = 401
                throw error
            }
            loadedUser = u
            return bcrypt.compare(password, u.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password')
                error.statusCode = 401
                throw error
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            }, process.env.JWT_SECRET, {
                expiresIn: '1h'
            })
            res.status(200).json({
                token,
                userId: loadedUser._id.toString(),
            })
        })
        .catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        })
}