const { validationResult } = require('express-validator')
const User = require('../models/user')
const bcrypt = require('bcryptjs')

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