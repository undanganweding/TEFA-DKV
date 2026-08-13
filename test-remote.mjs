async function test() {
  const res = await fetch('https://lkxzjggzeswuocirazhc.supabase.co/functions/v1/admin-manage-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list' })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
test();
