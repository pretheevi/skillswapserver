const express = require("express");
const router = express.Router();
const SkillsModel = require("../../models/skills");
const SkillMediaModel = require("../../models/skillMedia");
const jwt = require("../../middleware/jwt");
const validateSkills = require("../../middleware/validateSkills");
const {uploadPostMedia} = require("../../middleware/multer");
const path = require('path');
const fs = require('fs');
const fsPromise = require('fs').promises;


router.post("/skills", jwt.authMiddleware, uploadPostMedia.single("media"), validateSkills.create, async (req, res) => {
  try {
    console.log('post body', req.body);
    console.log('post file', req.file);
    const skillId = await SkillsModel.createSkill({
      user_id: req.user.id,
      title: req.body.title,
      category: req.body.category,
      level: req.body.level,
      description: req.body.description,
    });

    let mediaType;
    if (req.file.mimetype.startsWith("image/")) {
      mediaType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      mediaType = "video";
    } else {
      throw new Error("Unsupported media type");
    }

    if(req.file) {
      await SkillMediaModel.createMedia({
        skill_id: skillId,
        media_type: mediaType,
        media_url: `/uploads/posts/${req.file.filename}`,
      });
    }

    res.status(201).json({ message: "Skill created successfully" });
  } catch (error) {
    console.log('post error', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/skills", jwt.authMiddleware, async (req, res) => {
  try {
    const skills = await SkillsModel.getAllSkillsWithCommentAndMedia();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-skills", jwt.authMiddleware, async (req, res) => {
  try {
    const mySkills = await SkillsModel.getAllSkillsWithCommentAndMediaForSpecificUser(req.user.id);
    res.json(mySkills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-skillsById/:id", jwt.authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const mySkills = await SkillsModel.getAllSkillsWithCommentAndMediaForSpecificUser(userId);
    res.json(mySkills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/skills/:id", jwt.authMiddleware, async (req, res) => {
  try {
    const skill = await SkillsModel.getSkillWithCommentsAndMediaBySkillId(req.params.id)
    if (!skill) return res.status(404).json({ error: "Skill not found" });
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/skills/:id", jwt.authMiddleware, uploadPostMedia.single('media'), validateSkills.update, async (req, res) => {
  try {
    const skill = await SkillsModel.findSkillById(req.params.id);
    if (!skill) return res.status(404).json({ error: "Skill not found" });

    if (skill.user_id !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });
  
    // Initialize update data
    const updateData = {
      title: req.body.title,
      category: req.body.category,
      level: req.body.level, 
      description: req.body.description,
    };

    // Only update media if a new file is uploaded
    if (req.file) {
      const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      
      updateData.media = {
        media_type: mediaType,
        media_url: `/uploads/posts/${req.file.filename}`,
      }
    }

    await SkillsModel.updateSkillById(req.params.id, updateData);
    res.json({ message: "Skill updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/skills/:id", jwt.authMiddleware, async (req, res) => {
  try {
    const skill_id = req.params.id;

    // 1. Validate skill_id
    if (!skill_id || isNaN(skill_id)) {
      return res.status(400).json({ error: "Invalid skill ID" });
    }

    // 2. Find skill
    const skill = await SkillsModel.findSkillById(skill_id);
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }

    // 3. Authorization check
    if (skill.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this skill" });
    }

    // 4. Delete associated media file if it exists
    try {
      const media = await SkillMediaModel.getMediaBySkillId(skill_id);
      
      // Check if media exists and has a valid URL
      if (media && media.media_url) {
        // Extract filename from URL (handles different URL formats)
        const mediaUrl = media.media_url;
        let skillImageFilename;
        
        // Handle both absolute and relative paths
        if (mediaUrl.startsWith('/uploads/')) {
          skillImageFilename = path.basename(mediaUrl);
        } else if (mediaUrl.startsWith('http')) {
          // If it's a full URL, extract just the filename
          const urlObj = new URL(mediaUrl);
          skillImageFilename = path.basename(urlObj.pathname);
        } else {
          // Assume it's just a filename
          skillImageFilename = mediaUrl;
        }
        
        // Construct the correct file path
        const skillImagePath = path.join(process.cwd(), 'uploads', 'posts', skillImageFilename);
        
        console.log('Attempting to delete skill image:', skillImagePath);
        
        if (fs.existsSync(skillImagePath)) {
          await fsPromise.unlink(skillImagePath);
          console.log('Successfully deleted skill image file');
        } else {
          console.log('Skill image file not found at path:', skillImagePath);
          
          // Optional: Try alternative path (without leading slash)
          const altPath = path.join(process.cwd(), 'uploads', 'posts', mediaUrl);
          if (fs.existsSync(altPath)) {
            await fsPromise.unlink(altPath);
            console.log('Successfully deleted using alternative path');
          }
        }
      } else {
        console.log('No media file associated with this skill');
      }
    } catch(deleteError) {
      console.error('Error deleting skill image:', deleteError);
      // Don't fail the whole operation if file deletion fails
      // Continue with deleting the database record
    }

    // 5. Delete skill from database
    await SkillsModel.deleteSkillById(skill_id);
    
    res.json({ 
      success: true,
      message: "Skill deleted successfully" 
    });
    
  } catch (error) {
    console.error('Error in delete skill route:', error);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete skill",
      message: error.message 
    });
  }
});

module.exports = router;
