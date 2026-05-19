import { Queue } from 'bullmq';
import bullConnection from './redisConnection.js';

export const cuBotQueue = new Queue('cu-bot', {
  connection: bullConnection,
  prefix: 'regular_lms_cu_bot',
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

export const addCuBotJob = async (leadData) => {
  console.log(`📡 [Queue] Enqueuing CUCET job for lead: ${leadData.studentId}`);
  return await cuBotQueue.add(`lead-submit-${leadData.studentId}`, leadData);
};
