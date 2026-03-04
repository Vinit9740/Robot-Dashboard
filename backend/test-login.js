#!/usr/bin/env node

// Quick test of the login credentials
// Run: node test-login.js

const bcrypt = require('bcryptjs');

const testPassword = 'password123';
const storedHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/tsO';

async function testLogin() {
    console.log('🧪 Testing login credentials...\n');

    try {
        const isMatch = await bcrypt.compare(testPassword, storedHash);
        if (isMatch) {
            console.log('✅ Password matches!');
            console.log('\n📝 Test Credentials:');
            console.log('   Email: user@test.com');
            console.log('   Password: password123\n');
            console.log('   Email: admin@test.com');
            console.log('   Password: password123\n');
            console.log('   Email: demo@test.com');
            console.log('   Password: password123\n');
        } else {
            console.log('❌ Password does not match!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
