import cron from 'node-cron';
import { Op } from 'sequelize';
import databaseConnection from './config/database-connection.js';
import { Counsellor } from './models/index.js';
import sequelize from './config/database-config.js';
import { fileURLToPath } from 'url';
import path from 'path';

export async function runMidnightCleanup() {
    try {
        console.log('[CRON Worker] Starting daily midnight session + status cleanup...');

        // --- Step 1: Reset session/device/timing settings for ALL counsellors ---
        const [resetCount] = await Counsellor.update({
            is_logout: true,
            active_session_tokens: [],
            max_active_sessions: 1,
            allowed_devices: ['desktop'],
            login_start_time: '09:00:00',
            login_end_time: '20:00:00',
        }, {
            where: {}
        });
        console.log(`[CRON Worker] Reset sessions/settings for ${resetCount} counsellors.`);

        // --- Step 2: Status / block updates — L2 and L3 only based on last remark ---
        const now = new Date();
        const hr24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const days3Ago = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        // Get last remark time per counsellor for l2/l3 only (excluding dummy accounts)
        const lastRemarks = await sequelize.query(
            `SELECT counsellor_id, MAX(created_at) AS last_remark_at
             FROM student_remarks
             WHERE counsellor_id IN (
                 SELECT counsellor_id FROM counsellors
                 WHERE role IN ('l2', 'l3')
                   AND LOWER(counsellor_name) NOT LIKE '%dummy%'
             )
             GROUP BY counsellor_id`,
            { type: sequelize.QueryTypes.SELECT }
        );

        const l2l3Counsellors = await Counsellor.findAll({
            where: {
                role: { [Op.in]: ['l2', 'l3'] },
                counsellor_name: { [Op.notILike]: '%dummy%' },
            },
            attributes: ['counsellor_id', 'role'],
        });

        const remarkMap = {};
        lastRemarks.forEach(r => { remarkMap[r.counsellor_id] = new Date(r.last_remark_at); });

        const toBlock = [];
        const toInactive = [];
        const toResetActive = [];

        l2l3Counsellors.forEach(c => {
            const lastRemark = remarkMap[c.counsellor_id];
            if (!lastRemark) {
                // Never remarked — treat as inactive
                toInactive.push(c.counsellor_id);
                return;
            }
            if (lastRemark <= days3Ago) {
                toBlock.push(c.counsellor_id);
            } else if (lastRemark <= hr24Ago) {
                toInactive.push(c.counsellor_id);
            } else {
                toResetActive.push(c.counsellor_id);
            }
        });

        if (toBlock.length) {
            await Counsellor.update(
                { is_blocked: true, status: 'inactive' },
                { where: { counsellor_id: { [Op.in]: toBlock } } }
            );
            console.log(`[CRON Worker] Blocked ${toBlock.length} counsellors (no remark > 3 days).`);
        }

        if (toInactive.length) {
            await Counsellor.update(
                { is_blocked: false, status: 'inactive' },
                { where: { counsellor_id: { [Op.in]: toInactive } } }
            );
            console.log(`[CRON Worker] Set ${toInactive.length} counsellors to inactive (no remark > 24h).`);
        }

        if (toResetActive.length) {
            await Counsellor.update(
                { is_blocked: false, status: 'active' },
                { where: { counsellor_id: { [Op.in]: toResetActive } } }
            );
            console.log(`[CRON Worker] Kept ${toResetActive.length} counsellors active (remarked within 24h).`);
        }

        console.log('[CRON Worker] Midnight cleanup complete.');
    } catch (err) {
        console.error('[CRON Worker] Error running midnight cleanup:', err);
    }
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile);

if (isDirectRun) {
    databaseConnection();
    cron.schedule('0 0 * * *', async () => {
        await runMidnightCleanup();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    console.log('Midnight Auto-Logout + Status CRON Worker initialized. Waiting for 12:00 AM IST...');
}

