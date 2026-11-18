const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const ADMIN_URL = process.env.ADMIN_SUPABASE_URL || 'https://uzywiurbxltigexmjfqc.supabase.co';
const ADMIN_KEY = process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY;

const SHOP_URL = process.env.SHOP_SUPABASE_URL || 'https://ygwkvylthtzuoygkhmeu.supabase.co';
const SHOP_KEY = process.env.SHOP_SUPABASE_SERVICE_ROLE_KEY;

async function check(name, url, key) {
  if (!key) {
    console.log(`❌ [${name}] Key not found in environment or .env file.`);
    return;
  }

  try {
    const res = await fetch(url + '/rest/v1/', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
      },
    });

    if (!res.ok) {
      console.log(`❌ [${name}] HTTP Error: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    const tables = Object.keys(data.definitions || {});
    console.log(`\n========================================`);
    console.log(`📌 Project: ${name.toUpperCase()} (${url})`);
    console.log(`========================================`);
    if (tables.length === 0) {
      console.log(`⚠️  No tables found yet. Please run the SQL schema in the Supabase SQL Editor.`);
    } else {
      console.log(`✅ ${tables.length} Tables Detected:`);
      tables.forEach((t) => console.log(`   - ${t}`));
    }
  } catch (err) {
    console.error(`❌ [${name}] Error:`, err.message);
  }
}

async function run() {
  await check('Admin Database', ADMIN_URL, ADMIN_KEY);
  await check('Shop Database', SHOP_URL, SHOP_KEY);
}

run();

