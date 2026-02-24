import { PricingRule } from "../models/index.js";
import { Op } from "sequelize";

/**
 * @desc Create a new pricing rule
 * @route POST /v1/pricing-rules
 */
export const createPricingRule = async (req, res) => {
    try {
        const rule = await PricingRule.create(req.body);
        res.status(201).json({
            success: true,
            message: "Pricing rule created successfully",
            data: rule,
        });
    } catch (error) {
        console.error("Error creating pricing rule:", error);
        res.status(500).json({
            success: false,
            message: error.name === "SequelizeUniqueConstraintError"
                ? "Pricing rule for this page slug already exists"
                : error.message,
        });
    }
};

/**
 * @desc Get all pricing rules
 * @route GET /v1/pricing-rules
 */
export const getAllPricingRules = async (req, res) => {
    try {
        const { isActive, collegeName } = req.query;
        const where = {};

        if (isActive !== undefined) {
            where.isActive = isActive === "true";
        }

        if (collegeName) {
            where.collegeName = { [Op.iLike]: `%${collegeName}%` };
        }

        const rules = await PricingRule.findAll({
            where,
            order: [["created_at", "DESC"]],
        });

        res.status(200).json({
            success: true,
            data: rules,
        });
    } catch (error) {
        console.error("Error fetching pricing rules:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Get a single pricing rule by ID
 * @route GET /v1/pricing-rules/:id
 */
export const getPricingRuleById = async (req, res) => {
    try {
        const rule = await PricingRule.findByPk(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, message: "Pricing rule not found" });
        }
        res.status(200).json({ success: true, data: rule });
    } catch (error) {
        console.error("Error fetching pricing rule:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Update a pricing rule
 * @route PUT /v1/pricing-rules/:id
 */
export const updatePricingRule = async (req, res) => {
    try {
        const rule = await PricingRule.findByPk(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, message: "Pricing rule not found" });
        }

        await rule.update(req.body);
        res.status(200).json({
            success: true,
            message: "Pricing rule updated successfully",
            data: rule,
        });
    } catch (error) {
        console.error("Error updating pricing rule:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Delete a pricing rule
 * @route DELETE /v1/pricing-rules/:id
 */
export const deletePricingRule = async (req, res) => {
    try {
        const rule = await PricingRule.findByPk(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, message: "Pricing rule not found" });
        }

        await rule.destroy();
        res.status(200).json({
            success: true,
            message: "Pricing rule deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting pricing rule:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
