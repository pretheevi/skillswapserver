const express = require('express');
const router = express.Router();
const jwt = require('../../middleware/jwt');
const validateComment = require('../../middleware/validatecomment');
const Comment = require('../../models/commet');

router.post('/comment', jwt.authMiddleware, validateComment, async (req, res) => {
  const {text, skill} = req.body;
  const user = req.user._id;
  console.log('comment', {text, skill, user});
  try{
    const newComment = await Comment.create({skill, user, text})
    res.status(201).json(newComment);
  } catch(error) {
    console.log(error);  
  }
});


module.exports = router;