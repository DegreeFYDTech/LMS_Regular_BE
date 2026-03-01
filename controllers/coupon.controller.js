import { Coupon } from "../models/index.js";
import { Op } from "sequelize";

/**
 * @desc Create a new coupon
 * @route POST /v1/coupons
 */
export const createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: coupon,
        });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({
            success: false,
            message: error.name === "SequelizeUniqueConstraintError"
                ? "Coupon code already exists"
                : error.message,
        });
    }
};

/**
 * @desc Get all coupons with optional filtering
 * @route GET /v1/coupons
 */
export const getAllCoupons = async (req, res) => {
    try {
        const { isActive, search } = req.query;
        const where = {};

        if (isActive !== undefined) {
            where.isActive = isActive === "true";
        }

        if (search) {
            where.code = { [Op.iLike]: `%${search}%` };
        }

        const coupons = await Coupon.findAll({
            where,
            order: [["created_at", "DESC"]],
        });

        res.status(200).json({
            success: true,
            data: coupons,
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Get a single coupon by ID
 * @route GET /v1/coupons/:id
 */
export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Update a coupon
 * @route PUT /v1/coupons/:id
 */
export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        await coupon.update(req.body);
        res.status(200).json({
            success: true,
            message: "Coupon updated successfully",
            data: coupon,
        });
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Delete a coupon
 * @route DELETE /v1/coupons/:id
 */
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        await coupon.destroy();
        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
