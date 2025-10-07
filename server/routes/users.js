// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/authMiddleware');

// get all users (public) — used by search
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// get posts of a user
router.get('/:id/posts', async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id }).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// follow/unfollow — authenticated
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ msg: 'User not found' });

    const already = me.following.findIndex(id => id.equals(target._id)) !== -1;
    if (!already) {
      me.following.push(target._id);
      target.followers.push(me._id);
    } else {
      me.following = me.following.filter(id => !id.equals(target._id));
      target.followers = target.followers.filter(id => !id.equals(me._id));
    }
    await me.save();
    await target.save();
    res.json({ me: { id: me._id, following: me.following.length }, target: { id: target._id, followers: target.followers.length } });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// Search users
// routes/users.js
router.get('/search', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate('following', '_id');

    // get list of ids to exclude
    const excludeIds = [
      currentUser._id, 
      ...currentUser.following.map(f => f._id)
    ];

    // fetch all users except those
    const users = await User.find({ _id: { $nin: excludeIds } }, 'username email');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


  // Connect (follow a user)
  router.post('/connect/:id', auth, async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user.id);
  
      if (!userToFollow || !currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (!currentUser.following.includes(userToFollow._id)) {
        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);
        await currentUser.save();
        await userToFollow.save();
      }
  
      res.json({ message: 'Connected', following: currentUser.following });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Get profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate('followers', 'username email')
        .populate('following', 'username email');
  
      res.json({
        username: user.name,
        email: user.email,
        followers: user.followers,   // array of users
        following: user.following    // array of users
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
module.exports = router;
