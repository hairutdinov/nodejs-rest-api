const User = require('../models/user')
const bcrypt = require('bcryptjs')

module.exports = {
    createUser: async function ({ userInput }, req) {
        const { email, name, password } = userInput
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