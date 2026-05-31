// Throwaway: apply a .sql file to the DATABASE_URL DB via node-pg.
// Used once to apply scripts/sql/2026-05-30_gold_standard.sql to Neon.
import "dotenv/config";
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/_apply-sql.mjs <file.sql>");
  process.exit(1);
}
const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
const { rows } = await client.query(
  `select column_name from information_schema.columns
   where table_name = 'Business'
     and column_name in ('subcategory','qualityTier','internalContext','reviewFlag','googlePlaceId','googleMapsUrl','lastActiveAt','activitySource')
   order by column_name`,
);
await client.end();
console.log("Applied", file);
console.log("Business now has columns:", rows.map((r) => r.column_name).join(", "));
