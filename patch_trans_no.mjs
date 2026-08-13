import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:proyek13256456@db.lkxzjggzeswuocirazhc.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function patchDatabase() {
  try {
    console.log('Menghubungkan ke database...');
    await client.connect();
    
    const patchSql = `
CREATE OR REPLACE FUNCTION generate_trans_no(prefix text DEFAULT 'TRX')
RETURNS text AS $$
DECLARE
  seq_val bigint;
  date_str text;
BEGIN
  seq_val := nextval('trans_no_seq');
  date_str := to_char(now(), 'YYYYMMDD');
  -- Lpad increased to 6 digits to prevent truncation for sequences starting at 100 or higher
  RETURN prefix || '-' || date_str || '-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;
    `;
    
    console.log('Mengeksekusi SQL Patch...');
    await client.query(patchSql);
    console.log('✅ Fungsi generate_trans_no berhasil diperbarui.');
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  } finally {
    await client.end();
  }
}

patchDatabase();
