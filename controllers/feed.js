const { validationResult } = require('express-validator')
const Post = require('../models/post')
const fs = require('fs')
const path = require('path')
const User = require('../models/user')

const io = require('../socket')

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2
    let totalItems
    Post.find()
        .countDocuments()
        .then(c => {
            totalItems = c
            return Post.find()
                .populate('creator')
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(posts => {
            res.status(200).json({
                message: 'Posts fetched',
                posts,
                totalItems,
            })
        })
        .catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        })
}

exports.createPost = async (req, res, next) => {
    const { title, content } = req.body
    const errors = validationResult(req)
    let creator

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.')
        error.statusCode = 422
        throw error
    }

    const image = req.file

    if (!image) {
        const error = new Error('No image provided')
        error.statusCode = 422
        throw error
    }

    const imageUrl = image.path

    const post = new Post({
        title,
        content,
        imageUrl,
        creator: req.userId,
    })

    try {
        await post.save()
        const user = await User.findById(req.userId)
        user.posts.push(post)
        await user.save()

        io.getIO().emit('posts', {
            action: 'create',
            post: {
                ...post._doc,
                creator: {
                    id: req.userId,
                    name: user.name
                }
            }
        })

        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: user._id, name: user.name }
        })
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    }
}

exports.getPost = (req, res, next) => {
    const { id } = req.params
    Post.findById(id)
        .then(post => {
            if (!post) {
                const error = new Error('Could not found post')
                error.statusCode = 404
                throw error
            }
            return res.status(200).json({
                message: 'Post fetched',
                post,
            })
        })
        .catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        })
}

exports.updatePost = (req, res, next) => {
    const { id } = req.params

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.')
        error.statusCode = 422
        throw error
    }

    const { title, content } = req.body
    let imageUrl = req.body.image

    if (req.file) {
        imageUrl = req.file.path
    }

    if (!imageUrl) {
        const error = new Error('No file picked')
        error.statusCode = 422
        throw error
    }

    Post.findById(id)
        .then(post => {
            if (!post) {
                const error = new Error('Could not found post')
                error.statusCode = 404
                throw error
            }

            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized')
                error.statusCode = 403
                throw error
            }

            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl)
            }

            post.title = title
            post.content = content
            post.imageUrl = imageUrl
            return post.save()
        })
        .then(result => {
            res.status(200).json({
                message: 'Post updated',
                post: result
            })
        })
        .catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        })
}

exports.deletePost = (req, res, next) => {
    const { id } = req.params
    Post.findById(id)
        .then(post => {
            if (!post) {
                const error = new Error('Could not found post')
                error.statusCode = 404
                throw error
            }

            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized')
                error.statusCode = 403
                throw error
            }

            // TODO check if post author is current user and can delete
            clearImage(post.imageUrl)
            return Post.findByIdAndRemove(id)
        })
        .then(r => {
            return User.findById(req.userId)
        })
        .then(u => {
            u.posts.pull(id)
            return u.save()
        })
        .then(r => {
            res.status(200).json({
                message: 'Post deleted.',
            })
        })
        .catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        })
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.error(err))
}