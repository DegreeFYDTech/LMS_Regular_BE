import RegularDBRuleset from "../models/Regular_db_Ruleset.js";

export const getRuleset = async (req, res) => {
  try {
    const ruleset = await RegularDBRuleset.findOne();
    if (!ruleset) {
      return res.status(404).json({ message: "No ruleset found" });
    }
    res.json(ruleset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const upsertRuleset = async (req, res) => {
  try {
    const counsellorId = req.user.id;
    const { campaign_id } = req.body;

    if (!campaign_id || !Array.isArray(campaign_id)) {
      return res.status(400).json({ message: "campaign_id must be an array of strings" });
    }

    let ruleset = await RegularDBRuleset.findOne();
    const timestamp = new Date();

    if (ruleset) {
      ruleset.campaign_id = campaign_id;
      ruleset.createdBy = counsellorId;

      const historyEntry = {
        userId: counsellorId,
        action: "Updated ruleset",
        timestamp,
      };
      ruleset.history = [...(ruleset.history || []), historyEntry];

      await ruleset.save();
    } else {
      const historyEntry = {
        userId: counsellorId,
        action: "Created ruleset",
        timestamp,
      };
      ruleset = await RegularDBRuleset.create({
        campaign_id,
        createdBy: counsellorId,
        history: [historyEntry],
      });
    }

    res.json({ message: "Ruleset saved successfully", ruleset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
