import { fileURLToPath } from 'url';
import path from 'path';
import { configDotenv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

configDotenv({ path: path.resolve(__dirname, '../.env') });

import databaseConnection from '../config/database-connection.js';
databaseConnection();

import { startCuBotWorker } from './workers/cuBotWorker.js';

console.log('🤖 Starting CUCET Lead submission worker process...');
startCuBotWorker();
