module.exports = function validateComment(req, res, next) {
  const { text, skill } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ msg: "Comment text is required" });
  }

  if (!skill || skill.length !== 24) { 
    return res.status(400).json({ msg: "Valid skill ID is required" });
  }

  next();
};
