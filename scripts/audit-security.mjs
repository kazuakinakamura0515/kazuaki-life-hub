import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const migrationDir = new URL("../supabase/migrations/", import.meta.url);
const sql = readdirSync(migrationDir).filter((name)=>name.endsWith(".sql")).sort().map((name)=>readFileSync(new URL(name,migrationDir),"utf8")).join("\n");
const expected = ["profiles","cards","card_transactions","card_benefits","points_accounts","points_transactions","trips","trip_members","travel_bookings","news_sources","news_items","news_categories","saved_news","daily_briefs","camera_gear","camera_presets","app_settings","notifications","system_checks"];
const created = [...sql.matchAll(/create table(?: if not exists)?\s+(?:public\.)?(\w+)/gi)].map((match)=>match[1]);
const missingTables = expected.filter((table)=>!created.includes(table));
const explicitRls = [...sql.matchAll(/alter table(?: public\.)?(\w+) enable row level security/gi)].map((match)=>match[1]);
const loopTables = [...sql.matchAll(/foreach t in array array\[([^\]]+)\]/gi)].flatMap((block)=>[...block[1].matchAll(/'([^']+)'/g)].map((match)=>match[1]));
const rlsTables = new Set([...explicitRls,...loopTables]);
const missingRls = expected.filter((table)=>!rlsTables.has(table));

function sourceFiles(directory){return readdirSync(directory,{withFileTypes:true}).flatMap((entry)=>entry.isDirectory()?sourceFiles(join(directory,entry.name)):[join(directory,entry.name)]).filter((file)=>/\.(ts|tsx)$/.test(file))}
const clientLeaks = sourceFiles(fileURLToPath(new URL("../src/",import.meta.url))).filter((file)=>{const content=readFileSync(file,"utf8");return content.includes('"use client"')&&/(OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)/.test(content)});
const env = readFileSync(new URL("../.env.example",import.meta.url),"utf8");
const nonEmptyEnv = env.split("\n").filter((line)=>line&&!line.startsWith("#")&&!line.endsWith("="));

if(missingTables.length||missingRls.length||clientLeaks.length||nonEmptyEnv.length){console.error(JSON.stringify({missingTables,missingRls,clientSecretReferences:clientLeaks,nonEmptyExampleVariables:nonEmptyEnv},null,2));process.exit(1)}
console.log(`Security audit passed: ${expected.length} tables found; RLS coverage ${rlsTables.size}/${expected.length}; no client secret references.`);
