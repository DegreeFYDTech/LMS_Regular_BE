import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const WebhookEvent = sequelize.define(
    "WebhookEvent",
    {
        eventId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        eventType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        payload: {
            type: DataTypes.JSON,
        },
        processedAt: {
            type: DataTypes.DATE,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "PROCESSED", "FAILED"),
            defaultValue: "PENDING",
        },
        errorLog: {
            type: DataTypes.TEXT,
        },
    },
    {
        tableName: "webhook_events",
        timestamps: true,
        underscored: true,
    }
);

export default WebhookEvent;
