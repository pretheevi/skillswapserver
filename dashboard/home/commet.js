const express = require('express');
const router = express.Router();
const jwt = require('../../middleware/jwt');
const validateComment = require('../../middleware/validatecomment');
const Comment = require('../../models/comment');


router.get('/comments/:skill_id', jwt.authMiddleware, async (req, res) => {
  const skill_id = req.params.skill_id;
  try {
    const comments = await Comment.findBySkillId(skill_id);
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});

router.post('/comment', jwt.authMiddleware, validateComment, async (req, res) => {
  const {text, skill_id} = req.body;
  const user_id = req.user.id;
  console.log('comment', {text, skill_id, user_id});
  try{
    const newComment = await Comment.create({skill_id, user_id, text})
    res.status(201).json(newComment);
  } catch(error) {
    console.log(error);  
  }
});


module.exports = router;