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
          public_id TEXT,
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
        INSERT INTO SkillMedia (skill_id, media_type, media_url, public_id)
        VALUES (?, ?, ?, ?)
      `;
      const { skill_id, media_type = 'image', media_url, public_id } = mediaData;
      const result = await db.run(query, [skill_id, media_type, media_url, public_id]);
      return result.lastID;
    } catch(error) {
      throw error;
    }
  }

  static async getMediaBySkillId(skill_id) {
    try{
      const db = await this.getDb();
      const query = `SELECT * FROM SkillMedia WHERE skill_id = ?;`;
      const result = await db.get(query, [skill_id]); // Added await here
      return result;
    } catch(error) {
      throw error;
    }
  }

  static async updateMediaBySkillId(skill_id, mediaData) {
    try {
      const db = await this.getDb();
      const query = `
        UPDATE SkillMedia 
        SET media_type = ?, media_url = ?, public_id = ?
        WHERE skill_id = ?
      `;
      const { media_type, media_url, public_id } = mediaData;
      const result = await db.run(query, [media_type, media_url, public_id, skill_id]);
      return result;
    } catch(error) {
      throw error;
    }
  }
}

module.exports = SkillMediaModel;