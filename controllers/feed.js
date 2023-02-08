const { validationResult } = require('express-validator')
const Post = require('../models/post')
const fs = require('fs')
const path = require('path')

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2
    let totalItems
    Post.find()
        .countDocuments()
        .then(c => {
            totalItems = c
            return Post.find()
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

exports.createPost = (req, res, next) => {
    const { title, content } = req.body
    const errors = validationResult(req)

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
        creator: {
            name: 'Bulat'
        },
    })

    post.save()
        .then(result => {
            console.log(result)
            res.status(201).json({
                message: 'Post created successfully!',
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
            // TODO check if post author is current user and can delete
            clearImage(post.imageUrl)
            return Post.findByIdAndRemove(id)
        })
        .then(result => {
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