const mongoose = require("mongoose");
require('./commet');

const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: { type: String, required: true },

  category: {
    type: String,
    required: true,
    enum: [
      "web",
      "design",
      "data",
      "mobile",
      "marketing",
      "language"
    ]
  },

  level: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "beginner"
  },

  description: { type: String, required: true },

  rating: { type: Number, default: 0 }, // for later rating feature

}, { timestamps: true });


skillSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "skill",
});

skillSchema.set("toJSON", { virtuals: true });
skillSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Skill", skillSchema);
