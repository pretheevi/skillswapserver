const express = require("express");
const router = express.Router();
const SkillsModel = require("../../models/skills");
const SkillMediaModel = require("../../models/skillMedia");
const jwt = require("../../middleware/jwt");
const validateSkills = require("../../middleware/validateSkills");
const {uploadPostMedia} = require("../../middleware/upload");
const cloudinary = require('../../config/cloudinary');

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
        media_url: req.file.path, // cloudinary URL.
        public_id: req.file.filename // cloudinary public_id
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

    // Check if there's existing media for this skill
    const existingMedia = await SkillMediaModel.getMediaBySkillId(req.params.id);
    
    // Only update media if a new file is uploaded
    if (req.file) {
      const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      
      // Delete old file from Cloudinary if it exists
      if (existingMedia && existingMedia.public_id) {
        try {
          const result = await cloudinary.uploader.destroy(existingMedia.public_id, { resource_type: 'image' });
          console.log('Cloudinary destroy result (old file):', result); 
        } catch (cloudErr) {
          console.log('Cloudinary delete failed for old file:', cloudErr);
        }
      }
      
      // Update skill data with new media
      updateData.media = {
        media_type: mediaType,
        media_url: req.file.path, // Cloudinary URL from uploadPostMedia middleware
        public_id: req.file.filename // Cloudinary public_id from uploadPostMedia middleware
      };
      
      // Update or create media record
      if (existingMedia) {
        await SkillMediaModel.updateMediaBySkillId(req.params.id, {
          media_type: mediaType,
          media_url: req.file.path,
          public_id: req.file.filename
        });
      } else {
        await SkillMediaModel.createMedia({
          skill_id: req.params.id,
          media_type: mediaType,
          media_url: req.file.path,
          public_id: req.file.filename
        });
      }
    }
    
    // If no new file but we need to update other fields
    if (!req.file) {
      // Keep existing media data
      updateData.media = {
        media_type: existingMedia?.media_type || null,
        media_url: existingMedia?.media_url || null,
        public_id: existingMedia?.public_id || null
      };
    }

    // Update skill information
    await SkillsModel.updateSkillById(req.params.id, updateData);
    
    // Get updated skill with media
    const updatedSkill = await SkillsModel.getSkillWithCommentsAndMediaBySkillId(req.params.id);
    
    res.json({ 
      message: "Skill updated successfully",
      skill: updatedSkill
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'image' });
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
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
    const media = await SkillMediaModel.getMediaBySkillId(skill_id);

    if(media?.public_id) {
      try{
        const result = await cloudinary.uploader.destroy(media.public_id, { resource_type: 'image' });
        console.log('Cloudinary destroy result:', result); 
      } catch(cloudErr) {
        console.log('cloudinary delete failed', error); 
      }
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
