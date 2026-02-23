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
    console.log("🚀 SCRIPT STARTED: seedCoupons.js");
    try {
        console.log("🔗 Connecting to database...");
        await sequelize.authenticate();
        console.log("✅ Connection established successfully!");

        // Specifically sync ONLY the Coupon model table
        console.log("🔄 Syncing Coupons table...");
        await Coupon.sync({ alter: true });
        console.log("✅ Coupons table ready.");

        console.log("🌱 Inserting/Updating data...");

        for (const data of couponData) {
            const [coupon, created] = await Coupon.findOrCreate({
                where: { code: data.code.toUpperCase() },
                defaults: data
            });

            if (created) {
                console.log(`+ Created: ${data.code}`);
            } else {
                await coupon.update(data);
                console.log(`~ Updated: ${data.code}`);
            }
        }

        console.log("✨ ALL DONE!");
        process.exit(0);
    } catch (error) {
        console.error("❌ ERROR DURING SEEDING:", error);
        process.exit(1);
    }
}

seed();
