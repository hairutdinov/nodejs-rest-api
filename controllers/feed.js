const { validationResult } = require('express-validator')

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

exports.createPost = (req, res) => {
    const { title, content } = req.body
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed, entered data is incorrect.',
            errors: errors.array(),
        })
    }

    res.status(201).json({
        message: 'Post created successfully!',
        post: {
            _id: new Date().toISOString(),
            title,
            content,
            creator: {
                name: 'Bulat'
            },
            createdAt: new Date(),
        }
    })
}