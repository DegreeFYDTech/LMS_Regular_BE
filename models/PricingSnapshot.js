import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const PricingSnapshot = sequelize.define(
    "PricingSnapshot",
    {
        admissionId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        onModel: {
            type: DataTypes.ENUM("admissions", "registrations", "students"),
            allowNull: false,
        },
        baseAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        appliedCouponCode: {
            type: DataTypes.STRING,
        },
        discountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        finalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: "INR",
        },
        razorpayOrderId: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.ENUM("LOCKED", "PAID", "EXPIRED", "FAILED"),
            defaultValue: "LOCKED",
        },
    },
    {
        tableName: "pricing_snapshots",
        timestamps: true,
        underscored: true,
    }
);

export default PricingSnapshot;
