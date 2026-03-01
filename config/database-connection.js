import sequelize from './database-config.js';

async function databaseConnection() {
  try {
    console.time('⏱️ DB Connect + Sync Time');
    await sequelize.authenticate();
    console.log('✅ Database connected...');

    await sequelize.sync(); // Create tables if they don't exist, but don't alter existing ones
    console.log('🚀 Database models synchronized successfully.');

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
