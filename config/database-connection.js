import sequelize from './database-config.js';

let isInitialized = false;

async function databaseConnection() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    await sequelize.authenticate();

    await sequelize.query(`
      ALTER TABLE counsellors
        ADD COLUMN IF NOT EXISTS counsellor_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS did_number VARCHAR(30),
        ADD COLUMN IF NOT EXISTS dialer_user_id VARCHAR(50);
    `).catch(() => {});

    // await sequelize.sync(); // Create tables if they don't exist, but don't alter existing ones


  } catch (err) {
  }

  setInterval(async () => {
    try {
      await sequelize.query('SELECT 1');
    } catch (e) {
    }
  }, 5 * 60 * 1000);
}

export default databaseConnection;

