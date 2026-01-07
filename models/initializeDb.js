const SkillsModel = require('./skills');
const SkillMediaModel = require('./skillMedia');
const userModel = require('./user');
const UserFollows = require('./userFollows');
const commentModel = require('./comment');

async function initializeDb() {
  await Promise.all([
    userModel.createTable(),
    SkillsModel.createTable(),
    SkillMediaModel.createTable(),
    commentModel.createTable(),
    UserFollows.createTable(),
  ]);
}


if(require.main === module) {
  initializeDb()
    .then(() => {
      console.log("Database initialized successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error initializing database:", error);
      process.exit(1);
    });
}

module.exports = initializeDb;