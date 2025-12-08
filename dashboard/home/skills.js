const express = require("express");
const router = express.Router();
const Skill = require("../../models/skills");
const jwt = require("../../middleware/jwt");
const validateSkills = require("../../middleware/validateSkills");


router.post("/skills", jwt.authMiddleware, validateSkills.create, async (req, res) => {
  try {
    console.log("skills Logged user:", req.user); 
    const newSkill = await Skill.create({ ...req.body, user: req.user._id });
    res.status(201).json(newSkill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/skills", jwt.authMiddleware, async (req, res) => {
  try {
    const skills = await Skill.find()
                  .populate("user", "username email")
                  .populate({
                    path: "comments",
                    populate: {
                      path: "user",
                      select: "username email"
                    }
                  });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/skills/:id", jwt.authMiddleware, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate("user", "username email")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username email"
        }
      })
    if (!skill) return res.status(404).json({ error: "Skill not found" });
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-skills", jwt.authMiddleware, async (req, res) => {
  try {
    const mySkills = await Skill.find({ user: req.user._id })
      .populate("user", "username email")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username email"
        }
      });

    res.json(mySkills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put("/skills/:id", jwt.authMiddleware, validateSkills.update, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: "Skill not found" });

    if (skill.user.toString() !== req.user._id)
      return res.status(403).json({ error: "Not allowed" });

    const updated = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/skills/:id", jwt.authMiddleware, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: "Skill not found" });

    if (skill.user.toString() !== req.user._id)
      return res.status(403).json({ error: "Not allowed" });

    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
