const connectDb = require('../sql/db');

class SkillMediaModel {
  static async getDb() {
    const db = await connectDb();
    return db;
  }
  
  static async createTable() {
    try {
      const db = await this.getDb();
      const query = `
      CREATE TABLE IF NOT EXISTS SkillMedia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          skill_id INTEGER NOT NULL,
          media_type TEXT CHECK(media_type IN ('image', 'video')) DEFAULT 'image',
          media_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          FOREIGN KEY (skill_id) REFERENCES Skill(id) ON DELETE CASCADE
      );
      `
      await db.run(query);
    } catch(error) {
      console.log('Error creating skill media table:', error);
      throw error;
    }
  }

  static async createMedia(mediaData) {
    try {
      const db = await this.getDb();
      const query = `
        INSERT INTO SkillMedia (skill_id, media_type, media_url)
        VALUES (?, ?, ?)
      `;
      const { skill_id, media_type = 'image', media_url } = mediaData;
      const result = await db.run(query, [skill_id, media_type, media_url]);
      return result.lastID;
    } catch(error) {
      throw error;
    }
  }

  static async getMediaBySkillId(skill_id) {
    try{
      const db = await this.getDb();
      const query = `SELECT * FROM SkillMedia WHERE skill_id = ?;`;
      const result = db.get(query, [skill_id]);
      return result;
    } catch(error) {
      throw error;
    }
  }
}

module.exports = SkillMediaModel;