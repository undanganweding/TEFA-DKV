import postgres from 'postgres';
const sql = postgres('postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres');

async function checkRLS() {
  const policies = await sql`
    SELECT polname, polroles, polcmd, polqual 
    FROM pg_policy 
    WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = 'profiles');
  `;
  console.log("Profiles RLS Policies:");
  console.log(policies);
  
  const tables = await sql`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname IN ('profiles', 'finance_transactions', 'materials') AND relkind = 'r';
  `;
  console.log("Table RLS Enabled:");
  console.log(tables);

  process.exit(0);
}
checkRLS();
