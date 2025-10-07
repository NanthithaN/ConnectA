// routes/posts.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const auth = require('../middleware/authMiddleware');

// multer storage to server/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// Create post (authenticated)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const filename = req.file ? req.file.filename : '';
    const newPost = new Post({
      user: req.userId,
      caption: req.body.caption || '',
      file: filename
    });
    await newPost.save();
    await newPost.populate('user', 'name email');
    res.json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all posts (public feed)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err); res.status(500).json({ msg: 'Server error' });
  }
});

// Like/unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Not found' });
    const idx = post.likes.findIndex(id => id.equals(req.userId));
    if (idx === -1) post.likes.push(req.userId);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json(post);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// Comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Not found' });
    post.comments.push({ user: req.userId, text: req.body.text });
    await post.save();
    res.json(post);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

module.exports = router;
