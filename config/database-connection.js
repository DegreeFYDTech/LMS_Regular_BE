import sequelize from './database-config.js';

async function databaseConnection() {
  try {
    console.time('⏱️ DB Connect + Sync Time');
    await sequelize.authenticate();
    console.log('✅ Database connected...');

    await sequelize.sync(); // Create tables if they don't exist, but don't alter existing ones
    console.log('🚀 Database models synchronized successfully.');

    // Safe column migrations — ADD COLUMN IF NOT EXISTS never errors on re-run
    await sequelize.query(`
      ALTER TABLE counsellors
        ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_logout BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS login_start_time TIME,
        ADD COLUMN IF NOT EXISTS login_end_time TIME,
        ADD COLUMN IF NOT EXISTS allowed_ips JSON DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS allowed_devices JSON DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS max_active_sessions INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS active_session_tokens JSON DEFAULT '[]';
    `);
    console.log('✅ Counsellor column migrations applied.');

    // Ping the DB once to warm up query planner and buffers
    await sequelize.query('SELECT 1');
    console.log('🔁 Warm-up query executed.');

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
