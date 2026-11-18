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
const SHOP_SECRET_KEY = process.env.SHOP_SUPABASE_SERVICE_ROLE_KEY;
const SHOP_PUB_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function seed() {
  if (!ADMIN_KEY || !SHOP_SECRET_KEY || !SHOP_PUB_KEY) {
    console.error('❌ Missing credentials in .env. Please ensure ADMIN_SUPABASE_SERVICE_ROLE_KEY, SHOP_SUPABASE_SERVICE_ROLE_KEY, and VITE_SUPABASE_ANON_KEY are set.');
    process.exit(1);
  }

  console.log('🚀 Checking/Seeding data across both databases...\n');

  // 1. ADMIN DATABASE: Register "Vanakkam Xerox"
  console.log('1️⃣ Checking Shop in Admin Database...');
  
  const checkShop = await fetch(`${ADMIN_URL}/rest/v1/shops?slug=eq.vanakkam-xerox&select=*`, {
    headers: { 'apikey': ADMIN_KEY, 'Authorization': `Bearer ${ADMIN_KEY}` }
  });
  let [shop] = await checkShop.json();

  if (!shop) {
    const createShop = await fetch(`${ADMIN_URL}/rest/v1/shops`, {
      method: 'POST',
      headers: {
        'apikey': ADMIN_KEY,
        'Authorization': `Bearer ${ADMIN_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        slug: 'vanakkam-xerox',
        name: 'Vanakkam Xerox & Digital Print',
        owner_name: 'Sivajothi',
        owner_email: 'vanakkam@printexpress.in',
        owner_phone: '+919876543210',
        city: 'Chennai',
        state: 'Tamil Nadu',
        status: 'ACTIVE'
      })
    });
    [shop] = await createShop.json();
    console.log(`   ✅ Shop Created: "${shop.name}" (ID: ${shop.id})`);

    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    await fetch(`${ADMIN_URL}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': ADMIN_KEY,
        'Authorization': `Bearer ${ADMIN_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shop_id: shop.id,
        plan_code: 'PRO',
        billing_cycle: 'ANNUAL',
        status: 'ACTIVE',
        expiry_date: oneYearLater.toISOString()
      })
    });
    console.log(`   ✅ Subscription Activated: PRO Annual Plan (Expires: ${oneYearLater.toISOString().split('T')[0]})`);

    await fetch(`${ADMIN_URL}/rest/v1/licenses`, {
      method: 'POST',
      headers: {
        'apikey': ADMIN_KEY,
        'Authorization': `Bearer ${ADMIN_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shop_id: shop.id,
        license_key: 'PEXP-VX01-9942-2026',
        device_name: 'Main Counter PC',
        max_devices: 2,
        status: 'ACTIVE'
      })
    });
    console.log(`   ✅ Workstation License Issued: PEXP-VX01-9942-2026`);
  } else {
    console.log(`   ℹ️ Shop found: "${shop.name}" (ID: ${shop.id})`);
  }

  // 2. SHOP DATABASE: Seed Printing Prices
  console.log('\n2️⃣ Ensuring Printing Prices in Shared Shop Database for this shop...');
  
  const prices = [
    { paper_size: 'A4', print_type: 'BW', is_duplex: false, price_per_page_paise: 200 },
    { paper_size: 'A4', print_type: 'BW', is_duplex: true, price_per_page_paise: 300 },
    { paper_size: 'A4', print_type: 'COLOR', is_duplex: false, price_per_page_paise: 1000 },
    { paper_size: 'A4', print_type: 'COLOR', is_duplex: true, price_per_page_paise: 1800 },
    { paper_size: 'A3', print_type: 'BW', is_duplex: false, price_per_page_paise: 500 },
    { paper_size: 'A3', print_type: 'COLOR', is_duplex: false, price_per_page_paise: 2000 }
  ];

  for (const price of prices) {
    await fetch(`${SHOP_URL}/rest/v1/printing_prices`, {
      method: 'POST',
      headers: {
        'apikey': SHOP_SECRET_KEY,
        'Authorization': `Bearer ${SHOP_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        shop_id: shop.id,
        ...price
      })
    });
  }
  console.log(`   ✅ Synchronized ${prices.length} price tiers for Shop ID: ${shop.id}`);

  // 3. VERIFY VIA CLIENT-SIDE PUBLISHABLE KEY
  console.log('\n3️⃣ Testing Customer Web Access (via Publishable Key)...');
  const pubRes = await fetch(`${SHOP_URL}/rest/v1/printing_prices?shop_id=eq.${shop.id}&select=*`, {
    headers: {
      'apikey': SHOP_PUB_KEY,
      'Authorization': `Bearer ${SHOP_PUB_KEY}`
    }
  });

  const livePrices = await pubRes.json();
  console.log(`   ✅ Customer Web successfully retrieved ${livePrices.length} active price rates:`);
  livePrices.forEach(p => {
    console.log(`      - ${p.paper_size} ${p.print_type} (${p.is_duplex ? 'Back-to-Back' : 'Single'}): ₹${(p.price_per_page_paise / 100).toFixed(2)}`);
  });

  console.log('\n🎉 ALL DONE!');
}

seed();

