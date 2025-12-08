const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/users");
require("dotenv").config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📌 MongoDB connected");
  } catch (err) {
    console.log("❌ DB connection error:", err);
    process.exit(1);
  }
}

const randomBio = [
  "Coffee-powered coder ☕",
  "I break bugs for fun 🐞",
  "Learning by doing 🔧",
  "Let’s build cool stuff 🚀",
  "React + Node enthusiast 💻"
];

const randomAvatar = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

async function seedUsers() {
  const users = [
    { name: "byte_bunny", email: "bunny@demo.com", password: "demo123" },
    { name: "glitch_goblin", email: "goblin@demo.com", password: "demo123" },
    { name: "nerdy_nachos", email: "nacho@demo.com", password: "demo123" },
    { name: "wifi_warrior", email: "wifi@demo.com", password: "demo123" },
    { name: "crypto_crush", email: "crypto@demo.com", password: "demo123" },
    { name: "java_junkie", email: "java@demo.com", password: "demo123" },
    { name: "sigma_snake", email: "snake@demo.com", password: "demo123" },
    { name: "goofy_groot", email: "groot@demo.com", password: "demo123" },
    { name: "meme_machine", email: "meme@demo.com", password: "demo123" },
    { name: "pixel_panda", email: "panda@demo.com", password: "demo123" }
  ];

  try {
    await User.deleteMany();
    console.log("🗑️ Old users deleted");

    const salt = await bcrypt.genSalt(10);

    const seeded = users.map(u => ({
      ...u,
      password: bcrypt.hashSync(u.password, salt), // Hash real password
      avatar: randomAvatar(u.name),
      bio: randomBio[Math.floor(Math.random() * randomBio.length)]
    }));

    await User.insertMany(seeded);
    console.log("🎉 Users seeded successfully!");
  } catch (err) {
    console.log("❌ Error seeding users:", err);
  } finally {
    mongoose.disconnect();
  }
}

(async () => {
  await connectDB();
  await seedUsers();
})();
