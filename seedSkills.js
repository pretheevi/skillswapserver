const mongoose = require("mongoose");
const Skill = require("./models/skills");
const User = require("./models/users");
require("dotenv").config();

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("📌 MongoDB connected");
}

const randomSkill = [
  { title: "React.js Developer", category: "web", description: "I build cool UIs using React + Tailwind." },
  { title: "UI/UX Designer", category: "design", description: "Figma wizard, pixel-perfect layouts." },
  { title: "Python Data Analyst", category: "data", description: "I explore datasets and build insights." },
  { title: "Flutter App Dev", category: "mobile", description: "Native-like mobile apps with Dart." },
  { title: "SEO Strategist", category: "marketing", description: "Boosting rankings like a rocket 🚀" },
  { title: "English Tutor", category: "language", description: "Helping you speak confidently." },
  { title: "Full Stack Developer", category: "web", description: "MERN stack expert with 5+ years experience" },
  { title: "Graphic Designer", category: "design", description: "Creating stunning visuals for brands" },
  { title: "Machine Learning Engineer", category: "data", description: "Building AI models for real-world problems" },
  { title: "iOS Developer", category: "mobile", description: "Native iOS apps with SwiftUI" },
  { title: "Social Media Manager", category: "marketing", description: "Growing your social presence organically" },
  { title: "Spanish Teacher", category: "language", description: "Hablo español y te enseño también" },
  { title: "DevOps Engineer", category: "web", description: "CI/CD pipelines and cloud infrastructure" },
  { title: "Product Designer", category: "design", description: "From idea to pixel-perfect design" },
  { title: "Data Scientist", category: "data", description: "Statistical analysis and predictive modeling" }
];

function randomItem() {
  return randomSkill[Math.floor(Math.random() * randomSkill.length)];
}

async function seedSkills() {
  try {
    await Skill.deleteMany();
    console.log("🗑️ Old skills deleted");

    const users = await User.find();
    if (!users.length) return console.log("😢 No users found. Seed users first!");

    let skillsToInsert = [];
    let totalSkills = 0;

    users.forEach(user => {
      // each user will get 1–5 skills (random between 1 and 5 inclusive)
      const count = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < count; i++) {
        const skill = randomItem();
        skillsToInsert.push({
          user: user._id,
          title: skill.title,
          category: skill.category,
          description: skill.description,
          level: ["beginner", "intermediate", "expert"][Math.floor(Math.random() * 3)],
          rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
          updatedAt: new Date()
        });
        totalSkills++;
      }
    });

    await Skill.insertMany(skillsToInsert);
    console.log(`🎉 Seeded ${totalSkills} skill posts for ${users.length} users successfully!`);
    console.log(`📊 Average: ${(totalSkills / users.length).toFixed(1)} skills per user`);
  } catch (err) {
    console.log("❌ Error seeding skills:", err);
  } finally {
    mongoose.disconnect();
  }
}

(async () => {
  await connectDB();
  await seedSkills();
})();