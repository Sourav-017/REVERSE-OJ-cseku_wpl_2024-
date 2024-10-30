const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/', (req, res) => {
    db.query('SELECT id, title, subtitle, content, created_by, created_at FROM blogs ORDER BY created_at DESC', (error, rows) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Database error');
        }
        res.render('blogs', { blogPosts: rows, message: req.query.message || null });
    });
});

router.get('/:id', (req, res) => {
    db.query('SELECT * FROM blogs WHERE id = ?', [req.params.id], (error, rows) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Database error');
        }
        if (rows.length > 0) {
            res.render('singleBlog', { post: rows[0] }); 
        } else {
            res.status(404).send('Blog post not found');
        }
    });
});

router.post('/', (req, res) => {
    const { title, subtitle, content, created_by } = req.body; 

    if (!title || !content || !created_by) {
        return res.status(400).send('Title, content, and author are required');
    }
    db.query('INSERT INTO blogs (title, subtitle, content, created_by, created_at) VALUES (?, ?, ?, ?, NOW())', 
        [title, subtitle, content, created_by], 
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error adding blog post');
            }
            res.redirect('/blogs?message=Blog post has been added successfully!');
        }
    );
});

module.exports = router;
