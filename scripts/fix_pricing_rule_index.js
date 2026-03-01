import { configDotenv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
configDotenv({ path: path.join(__dirname, "../.env") });

import sequelize from "../config/database-config.js";

async function fixIndex() {
    try {
        console.log("Starting exhaustive index/constraint fix...");
        await sequelize.authenticate();

        // 1. Get all unique constraints on pricing_rules
        const [constraints] = await sequelize.query(`
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'pricing_rules'::regclass AND contype = 'u';
        `);
        console.log("Found constraints:", constraints.map(c => c.conname));

        for (const { conname } of constraints) {
            if (conname.includes('page_slug')) {
                console.log(`Dropping constraint: ${conname}`);
                await sequelize.query(`ALTER TABLE pricing_rules DROP CONSTRAINT "${conname}" CASCADE`);
            }
        }

        // 2. Get all indexes on pricing_rules
        const [indexes] = await sequelize.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'pricing_rules';
        `);
        console.log("Found indexes:", indexes.map(i => i.indexname));

        for (const { indexname, indexdef } of indexes) {
            // Drop any single-column unique index on page_slug
            if (indexdef.includes('UNIQUE') && indexdef.includes('(page_slug)') && !indexdef.includes('campus_location')) {
                console.log(`Dropping old index: ${indexname}`);
                await sequelize.query(`DROP INDEX IF EXISTS "${indexname}" CASCADE`);
            }
        }

        // 3. Add clean new composite unique indexes
        console.log("Adding clean composite unique indexes...");

        // Remove those we might have added half-way
        await sequelize.query(`DROP INDEX IF EXISTS pricing_rules_page_slug_campus_not_null_idx CASCADE`);
        await sequelize.query(`DROP INDEX IF EXISTS pricing_rules_page_slug_campus_null_idx CASCADE`);
        await sequelize.query(`DROP INDEX IF EXISTS pricing_rules_composite_unique CASCADE`);

        await sequelize.query(`
            CREATE UNIQUE INDEX pricing_rules_page_slug_campus_not_null_idx 
            ON pricing_rules (page_slug, campus_location) 
            WHERE campus_location IS NOT NULL;
        `);

        await sequelize.query(`
            CREATE UNIQUE INDEX pricing_rules_page_slug_campus_null_idx 
            ON pricing_rules (page_slug) 
            WHERE campus_location IS NULL;
        `);

        console.log("Exhaustive fix complete!");
    } catch (error) {
        console.error("Error during fix:", error);
    } finally {
        await sequelize.close();
    }
}

fixIndex();
