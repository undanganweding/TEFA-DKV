import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`
  }
})
.then(async r => {
  console.log('STATUS:', r.status);
  console.log('BODY:', await r.text());
})
.catch(err => {
  console.error('FETCH FAILED:', err);
});
