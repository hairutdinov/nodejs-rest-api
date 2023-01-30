const { validationResult } = require('express-validator')
const Post = require('../models/post')

exports.getPosts = (req, res, next) => {
    Post
        .find()
        .then(posts => {
            res.status(200).json({
                message: 'Posts fetched',
                posts,
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
    const image = req.file
    const errors = validationResult(req)

    if (!image) {
        const error = new Error('No image provided')
        error.statusCode = 422
        throw error
    }

    const imageUrl = image.path

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.')
        error.statusCode = 422
        throw error
    }

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