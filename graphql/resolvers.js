const bcrypt = require('bcryptjs')
const validator = require('validator')
const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Post = require('../models/post')

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
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )
        return { token: token, userId: user._id.toString() }
    },
    createPost: async function({ postInput }, req) {
        if (!req.isAuth) {
            const e = new Error('Not authenticated!')
            e.statusCode = 401
            throw e
        }
        const errors = []
        if (
            validator.isEmpty(postInput.title) ||
            !validator.isLength(postInput.title, { min: 5 })
        ) {
            errors.push({ message: 'Title is invalid.' })
        }
        if (
            validator.isEmpty(postInput.content) ||
            !validator.isLength(postInput.content, { min: 5 })
        ) {
            errors.push({ message: 'Content is invalid.' })
        }
        if (errors.length > 0) {
            const e = new Error('Invalid input.')
            e.data = errors
            e.statusCode = 422
            throw e
        }
        const user = await User.findById(req.userId)
        if (!user) {
            const e = new Error('Invalid user.')
            e.statusCode = 401
            throw e
        }
        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        })
        const createdPost = await post.save()
        user.posts.push(createdPost)
        await user.save()
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
    },
    posts: async function({ page }, req) {
        if (!req.isAuth) {
            const e = new Error('Not authenticated!');
            e.statusCode = 401;
            throw e;
        }
        if (!page) {
            page = 1;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator');
        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                };
            }),
            totalPosts: totalPosts
        };
    }
}