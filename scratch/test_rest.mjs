import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testRestEndpoint() {
  const targetId = '38bc3c49-cbad-40a4-91cc-f827944c7730';
  const url = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${targetId}`;

  console.log(`--- 2. TEST SUPABASE REST ENDPOINT ---`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    console.log(`HTTP STATUS: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`RESPONSE BODY:`, text);
  } catch (error) {
    console.error(`FETCH ERROR:`, error.message);
  }
}

testRestEndpoint();
