import { Coupon, sequelize } from '../models/index.js';

const couponData = [
    {
        code: "CUAPPLY500",
        discountType: "FLAT",
        discountValue: 500,
        minOrderAmount: 0,
        validFrom: "2026-01-12T12:04:31.052Z",
        validTill: "2027-01-12T18:30:00.000Z",
        isActive: true,
        usageLimitGlobal: 100,
        usageLimitPerUser: 1,
        usedCount: 17,
        applicablePages: ["cu-application-form"]
    },
    {
        code: "AMITY500",
        discountType: "FLAT",
        discountValue: 500,
        minOrderAmount: 0,
        validFrom: "2026-01-12T12:17:05.281Z",
        validTill: "2027-01-11T18:30:00.000Z",
        isActive: true,
        usageLimitGlobal: 100,
        usageLimitPerUser: 1,
        usedCount: 0,
        applicablePages: ["amity-application-form"]
    },
    {
        code: "LPU200",
        discountType: "FLAT",
        discountValue: 200,
        minOrderAmount: 0,
        validFrom: "2026-01-12T12:18:26.257Z",
        validTill: "2027-01-12T18:30:00.000Z",
        isActive: true,
        usageLimitGlobal: 100,
        usageLimitPerUser: 1,
        usedCount: 7,
        applicablePages: ["lpu-application-form"]
    },
    {
        code: "TEST999",
        description: "test coupon",
        discountType: "FLAT",
        discountValue: 999,
        minOrderAmount: 0,
        validFrom: "2026-02-16T11:38:00.989Z",
        validTill: "2026-02-17T18:30:00.000Z",
        isActive: true,
        usageLimitGlobal: 100,
        usageLimitPerUser: 1,
        usedCount: 10,
        applicablePages: ["lpu-application-form"]
    }
];

async function seed() {
    try {
        await sequelize.authenticate();

        // Specifically sync ONLY the Coupon model table
        await Coupon.sync({ alter: true });


        for (const data of couponData) {
            const [coupon, created] = await Coupon.findOrCreate({
                where: { code: data.code.toUpperCase() },
                defaults: data
            });

            if (created) {
            } else {
                await coupon.update(data);
            }
        }

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

seed();
