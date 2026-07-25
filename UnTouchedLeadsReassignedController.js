import cron from 'node-cron';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { sequelize, Student, LeadAssignmentLogs, StudentLeadActivity } from "./models/index.js";
import { assignLeadHelper } from './helper/leadAssignmentService.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const getFifteenMinutesAgoIST = () => {
    return dayjs().tz('Asia/Kolkata').subtract(15, 'minute');
};

const retryAttempts = new Map();

const reassignInactiveLeadsCron = async () => {

    const fifteenMinutesAgoIST = getFifteenMinutesAgoIST();
    const fifteenMinutesAgoUTC = fifteenMinutesAgoIST.utc();

    const todayStartIST = dayjs().tz('Asia/Kolkata').startOf('day');
    const todayStartUTC = todayStartIST.utc();

    const twentyFourHoursAgoIST = dayjs().tz('Asia/Kolkata').subtract(24, 'hour');
    const twentyFourHoursAgoUTC = twentyFourHoursAgoIST.utc();

    try {
        const eligibleLeads = await Student.findAll({
            where: {
                assigned_counsellor_id: { [Op.ne]: null },
                is_opened: false,
                created_at: { [Op.lt]: fifteenMinutesAgoUTC.toDate() },
                [Op.and]: [
                    {
                        [Op.or]: [
                            { reassigneddate: null },
                            { reassigneddate: { [Op.lt]: todayStartUTC.toDate() } },
                            { reassigneddate: { [Op.lt]: twentyFourHoursAgoUTC.toDate() } }
                        ]
                    }
                ]
            }
        });


        let reassignedCount = 0;
        let failedCount = 0;
        let skippedSameCounsellorCount = 0;
        let retryLimitReachedCount = 0;

        for (const lead of eligibleLeads) {
            try {
                
                const currentRetryCount = retryAttempts.get(lead.student_id) || 0;
                
                if (currentRetryCount >= 2) {
                    retryLimitReachedCount++;
                    continue;
                }

                const leadActivity = await StudentLeadActivity.findOne({
                    where: { student_id: lead.student_id }
                });

                if (!leadActivity) {
                    failedCount++;
                    continue;
                }

                const oldCounsellorId = lead.assigned_counsellor_id;

                const leadData = {
                    email: lead.student_email,
                    phoneNumber: lead.student_phone,
                    name: lead.student_name,
                    preferred_city: lead.preferred_city,
                    preferred_state: lead.preferred_state,
                    preferred_degree: lead.preferred_degree,
                    preferred_level: lead.preferred_level,
                    preferred_budget: lead.preferred_budget,
                    preferred_specialization: lead.preferred_specialization,
                    mode: lead.mode,
                    source: lead.source,
                    utmCampaign: leadActivity.utmCampaign,
                    first_source_url: lead.first_source_url
                };

                const assignmentResult = await assignLeadHelper(leadData);

                if (!assignmentResult.success) {
                    failedCount++;
                    continue;
                }

                const newCounsellor = assignmentResult.assignedCounsellor;

                if (!newCounsellor || !newCounsellor.counsellor_id) {
                    failedCount++;
                    continue;
                }

                if (oldCounsellorId === newCounsellor.counsellor_id) {
                    const newRetryCount = currentRetryCount + 1;
                    retryAttempts.set(lead.student_id, newRetryCount);
                    
                    
                    if (newRetryCount >= 2) {
                        retryLimitReachedCount++;
                    }
                    
                    skippedSameCounsellorCount++;
                    continue;
                }

                retryAttempts.delete(lead.student_id);

                await Student.update({
                    assigned_counsellor_id: newCounsellor.counsellor_id,
                    reassigneddate: dayjs().tz('Asia/Kolkata').toDate(),
                    is_opened: false,
                    updated_at: dayjs().tz('Asia/Kolkata').toDate()
                }, {
                    where: { student_id: lead.student_id }
                });

                await LeadAssignmentLogs.create({
                    student_id: lead.student_id,
                    assigned_counsellor_id: newCounsellor.counsellor_id,
                    assigned_by: 'system',
                    reference_from: 'inactivity_reassignment',
                    reason: 'is_opened_false'
                });

                reassignedCount++;

            } catch (error) {
                failedCount++;
            }
        }


    } catch (error) {
    }
};

sequelize.authenticate()
    .then(() => {

        cron.schedule('* 11-20 * * 1-6', reassignInactiveLeadsCron, {
            timezone: 'Asia/Kolkata'
        });

    })
    .catch(err => {
    });

process.on('SIGINT', () => {
    process.exit(0);
});

export { reassignInactiveLeadsCron };