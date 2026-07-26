import sequelize from './database-config.js';

let isInitialized = false;

async function databaseConnection() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    await sequelize.authenticate();

    console.log('🚀 Database models synchronized successfully.');


  } catch (err) {
  }

  setInterval(async () => {
    try {
     
      console.log('🔄 Keep-alive ping sent');
    } catch (e) {
    }
  }, 5 * 60 * 1000);
}

export default databaseConnection;

