import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../supabase/migrations/001_initial_schema.sql", import.meta.url), "utf8");
const expected = ["profiles","cards","card_transactions","card_benefits","points_accounts","points_transactions","trips","trip_members","travel_bookings","news_sources","news_items","news_categories","saved_news","daily_briefs","camera_gear","camera_presets","app_settings","notifications"];
const created = [...sql.matchAll(/create table\s+(\w+)/gi)].map((match) => match[1]);
const missing = expected.filter((table) => !created.includes(table));
const rlsBlock = sql.match(/foreach t in array array\[([^\]]+)\]/i)?.[1] ?? "";
const rlsTables = ["profiles", ...[...rlsBlock.matchAll(/'([^']+)'/g)].map((match) => match[1])];
const rlsMissing = expected.filter((table) => !rlsTables.includes(table));
if (missing.length || rlsMissing.length) {
  console.error(JSON.stringify({ missingTables: missing, missingRls: rlsMissing }, null, 2));
  process.exit(1);
}
if (!sql.includes('create policy "owner_profile"') || !sql.includes('create policy "owner_all"')) {
  console.error("Owner policies are missing."); process.exit(1);
}
console.log(`Security audit passed: ${expected.length} tables found; RLS coverage ${rlsTables.length}/${expected.length}.`);
