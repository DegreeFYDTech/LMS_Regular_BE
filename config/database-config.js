import { Sequelize } from 'sequelize';
import { configDotenv } from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
configDotenv({ path: path.join(__dirname, '../.env') });

const isProd = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.SUPABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',

  dialectOptions: isProd
    ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
    : {},

  logging: false,

  pool: {
    max: 10,
    min: 3,
    acquire: 70000,
    idle: 10000,
  },
});

export default sequelize;
