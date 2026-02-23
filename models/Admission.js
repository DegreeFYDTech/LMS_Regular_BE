import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const Admission = sequelize.define(
    "Admission",
    {
        name: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING, allowNull: false },
        mobile: { type: DataTypes.STRING, allowNull: false },
        countryCode: { type: DataTypes.STRING, defaultValue: "+91" },
        alternateNumber: { type: DataTypes.STRING },
        gender: { type: DataTypes.STRING },
        dob: { type: DataTypes.DATE },
        state: { type: DataTypes.STRING },
        city: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        fatherName: { type: DataTypes.STRING },
        fatherPhone: { type: DataTypes.STRING },
        fatherOccupation: { type: DataTypes.STRING },
        fatherEmail: { type: DataTypes.STRING },
        campusLocation: { type: DataTypes.STRING },
        interestedCourse: { type: DataTypes.STRING },
        specialization: { type: DataTypes.STRING },
        lastQualification: { type: DataTypes.STRING },
        lastQualificationPercentage: { type: DataTypes.DECIMAL(5, 2) },
        collegeForApplied: { type: DataTypes.STRING, allowNull: false },
        pageUrl: { type: DataTypes.TEXT },
        paymentStatus: {
            type: DataTypes.ENUM("PENDING", "PARTIAL", "COMPLETED", "FAILED", "REFUNDED"),
            defaultValue: "PENDING",
        },
        pricingSnapshotId: { type: DataTypes.INTEGER },
        UTRNumber: { type: DataTypes.STRING },
    },
    {
        tableName: "admissions",
        timestamps: true,
        underscored: true,
    }
);

export default Admission;
