import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const Coupon = sequelize.define(
    "Coupon",
    {
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            set(value) {
                this.setDataValue("code", value.toUpperCase().trim());
            },
        },
        description: {
            type: DataTypes.TEXT,
        },
        discountType: {
            type: DataTypes.ENUM("FLAT", "PERCENTAGE"),
            allowNull: false,
        },
        discountValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        maxDiscountAmount: {
            type: DataTypes.DECIMAL(10, 2),
        },
        minOrderAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        validFrom: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        validTill: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        usageLimitGlobal: {
            type: DataTypes.INTEGER,
            defaultValue: 1000,
        },
        usageLimitPerUser: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        usedCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        applicablePages: {
            type: DataTypes.JSON, // Storing array of strings as JSON
            defaultValue: [],
        },
    },
    {
        tableName: "coupons",
        timestamps: true,
        underscored: true,
    }
);

export default Coupon;
