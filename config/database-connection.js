import sequelize from './database-config.js';

let isInitialized = false;

async function databaseConnection() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    console.time('⏱️ DB Connect + Sync Time');
    await sequelize.authenticate();
    console.log('✅ Database connected...');

    await sequelize.query(`
      ALTER TABLE counsellors
        ADD COLUMN IF NOT EXISTS counsellor_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS did_number VARCHAR(30),
        ADD COLUMN IF NOT EXISTS dialer_user_id VARCHAR(50);
    `).catch(() => {});

    // await sequelize.sync(); // Create tables if they don't exist, but don't alter existing ones
    console.log('🚀 Database models synchronized successfully.');


    console.timeEnd('⏱️ DB Connect + Sync Time');
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err);
  }

  setInterval(async () => {
    try {
      await sequelize.query('SELECT 1');
      console.log('🔄 Keep-alive ping sent');
    } catch (e) {
      console.error('⚠️ Keep-alive ping failed:', e.message);
    }
  }, 5 * 60 * 1000);
}

export default databaseConnection;

