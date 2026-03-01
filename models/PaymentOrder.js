import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const PaymentOrder = sequelize.define(
    "PaymentOrder",
    {
        pricingSnapshotId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        razorpayOrderId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        amountPaid: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        amountDue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: "INR",
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        payments: {
            type: DataTypes.JSON, // To store array of payment attempts
            defaultValue: [],
        },
    },
    {
        tableName: "payment_orders",
        timestamps: true,
        underscored: true,
    }
);

export default PaymentOrder;
