const User = require('../models/user')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const jwt = require('jsonwebtoken')

module.exports = {
    createUser: async function ({ userInput }, req) {
        const { email, name, password } = userInput
        const errors = []
        if (!validator.isEmail(email)) {
            errors.push({ message: 'E-mail is invalid'})
        }

        if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
            errors.push({ message: 'Password too short' })
        }

        if (errors.length > 0) {
            const e = new Error('Invalid input')
            e.data = errors
            e.statusCode = 422
            throw e
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            const e = new Error('User exists already!')
            throw e
        }
        const hashedPw = await bcrypt.hash(password, 12)
        const user = User({
            email,
            name,
            password: hashedPw
        })
        const createdUser = await user.save()
        return {
            ...createdUser._doc,
            _id: createdUser._id.toString()
        }
    },
    login: async function({ email, password }) {
        const user = await User.findOne({ email })
        if (!user) {
            const e = new Error('User not found')
            e.statusCode = 401
            throw e
        }
        const isEqual = await bcrypt.compare(password, user.password)
        if (!isEqual) {
            const e = new Error('Password is incorrect.')
            e.statusCode = 401
            throw e
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: '1h' })
        return {
            token,
            userId: user._id.toString()
        }
    }
}