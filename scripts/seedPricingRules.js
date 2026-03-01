import { PricingRule, sequelize } from '../models/index.js';

const pricingData = [
    {
        pageSlug: "cgc-landran-admission-form",
        collegeName: "CGC Landran",
        baseAmount: 10000,
        currency: "INR",
        isActive: true,
        allowCoupons: true
    },
    {
        pageSlug: "lpu-application-form",
        collegeName: "Lovely Professional University",
        baseAmount: 1000,
        currency: "INR",
        isActive: true,
        allowCoupons: true
    },
    {
        pageSlug: "amity-application-form",
        collegeName: "Amity University",
        baseAmount: 1100,
        currency: "INR",
        isActive: true,
        allowCoupons: true
    },
    {
        pageSlug: "cu-application-form",
        collegeName: "Chandigarh University",
        baseAmount: 1000,
        currency: "INR",
        isActive: true,
        allowCoupons: true
    },
    {
        pageSlug: "cgc-landran-application-form",
        collegeName: "CGC Landran",
        baseAmount: 200,
        currency: "INR",
        isActive: true,
        allowCoupons: true
    }
];

async function seed() {
    console.log("🚀 SCRIPT STARTED: seedPricingRules.js");
    try {
        console.log("🔗 Connecting to database...");
        await sequelize.authenticate();
        console.log("✅ Connection established successfully!");

        // Specifically sync ONLY the PricingRule model table
        console.log("🔄 Syncing PricingRules table...");
        await PricingRule.sync({ alter: true });
        console.log("✅ PricingRules table ready.");

        console.log("🌱 Inserting/Updating data...");

        for (const data of pricingData) {
            const [rule, created] = await PricingRule.findOrCreate({
                where: { pageSlug: data.pageSlug },
                defaults: data
            });

            if (created) {
                console.log(`+ Created: ${data.pageSlug}`);
            } else {
                await rule.update(data);
                console.log(`~ Updated: ${data.pageSlug}`);
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
