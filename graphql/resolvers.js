const User = require('../models/user')
const bcrypt = require('bcryptjs')
const validator = require('validator')

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
    }
}