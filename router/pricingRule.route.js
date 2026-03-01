import express from "express";
import {
    createPricingRule,
    getAllPricingRules,
    getPricingRuleById,
    updatePricingRule,
    deletePricingRule,
} from "../controllers/pricingRule.controller.js";

const router = express.Router();

router.post("/", createPricingRule);
router.get("/", getAllPricingRules);
router.get("/:id", getPricingRuleById);
router.put("/:id", updatePricingRule);
router.delete("/:id", deletePricingRule);

export default router;
