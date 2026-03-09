// Run this once to fix your Admin Password
// Usage: npx ts-node fix-admin-password.ts <YOUR_EMAIL> <NEW_PASSWORD>

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
    console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetPassword() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error("❌ Usage: npx ts-node fix-admin-password.ts <email> <new_password>");
        process.exit(1);
    }

    console.log(`📡 Resetting password for: ${email}...`);

    // 1. Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("❌ Failed to list users:", listError.message);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error("❌ User not found with that email!");
        return;
    }

    // 2. Force update password and ensure admin role + verified status
    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
            password: password,
            app_metadata: {
                role: 'admin',
                verified: true
            }
        }
    );

    if (updateError) {
        console.error("❌ Failed to update password:", updateError.message);
    } else {
        console.log(`✅ SUCCESS! Password set for ${email}.`);
        console.log(`🔑 Role set to: admin`);
        console.log(`🛡️ Status set to: verified`);
        console.log("\nNow you can log in on the website with this email and password!");
    }
}

resetPassword();
