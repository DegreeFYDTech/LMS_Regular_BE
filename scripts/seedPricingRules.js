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
    try {
        await sequelize.authenticate();

        // Specifically sync ONLY the PricingRule model table
        await PricingRule.sync({ alter: true });


        for (const data of pricingData) {
            const [rule, created] = await PricingRule.findOrCreate({
                where: { pageSlug: data.pageSlug },
                defaults: data
            });

            if (created) {
            } else {
                await rule.update(data);
            }
        }

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

seed();
