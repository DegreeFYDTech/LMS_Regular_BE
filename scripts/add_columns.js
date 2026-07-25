
import sequelize from '../config/database-config.js';
import { QueryTypes } from 'sequelize';

const migrate = async () => {
  try {
    
    await sequelize.query(`
      ALTER TABLE "website_chat_messages" 
      ADD COLUMN IF NOT EXISTS "sender_user_id" VARCHAR(255);
    `, { type: QueryTypes.RAW });

    await sequelize.query(`
      ALTER TABLE "website_chat_messages" 
      ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(255);
    `, { type: QueryTypes.RAW });

    try {
        await sequelize.query(`
          ALTER TYPE "enum_website_chat_messages_sender_type" ADD VALUE IF NOT EXISTS 'Counsellor';
          ALTER TYPE "enum_website_chat_messages_sender_type" ADD VALUE IF NOT EXISTS 'Admin';
        `, { type: QueryTypes.RAW });
    } catch (e) {
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

migrate();
