const { validationResult } = require('express-validator')
const Post = require('../models/post')

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [
            {
                _id: 1,
                title: 'First post',
                content: 'This is the first post',
                imageUrl: 'images/book.jpeg',
                creator: {
                    name: 'Bulat'
                },
                createdAt: new Date(),
            }
        ]
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

    const post = new Post({
        title,
        content,
        imageUrl: 'images/book.jpeg',
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