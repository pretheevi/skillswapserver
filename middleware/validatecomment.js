module.exports = function validateComment(req, res, next) {
  const { text, skill_id } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ msg: "Comment text is required" });
  }

  if (!skill_id || typeof skill_id !== "number") { 
    return res.status(400).json({ msg: "Valid skill ID is required" });
  }

  next();
};
