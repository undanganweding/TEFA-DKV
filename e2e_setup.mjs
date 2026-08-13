import { createClient } from '@supabase/supabase-js';

const URL = 'https://lkxzjggzeswuocirazhc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHpqZ2d6ZXN3dW9jaXJhemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzM5MDgsImV4cCI6MjEwMTk0OTkwOH0.lNOMBP7ZevhgSxYv11OcJdCtsku2-xs-TdMVH7TXNuE';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setup() {
    const serviceClient = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: users } = await serviceClient.auth.admin.listUsers();
    
    const adminId = users.users.find(u => u.email === 'admin_e2e@test.com')?.id;
    if (adminId) {
        // Use UPSERT
        const { error } = await serviceClient.from('profiles').upsert({
            id: adminId, full_name: 'Admin E2E', role: 'Admin', status: 'Active'
        });
        if (error) console.error("Admin profile error:", error);
        else console.log("Admin profile UPSERT successful.");
    }

    const studentId = users.users.find(u => u.email === 'student_e2e@test.com')?.id;
    if (studentId) {
        const { error } = await serviceClient.from('profiles').upsert({
            id: studentId, full_name: 'Student E2E', role: 'Student', status: 'Active'
        });
        if (error) console.error("Student profile error:", error);
        else console.log("Student profile UPSERT successful.");
    }
}
setup();
