const bcrypt = require('bcryptjs');

async function test() {
    const hash = '$2b$10$XLSR5sQ6cT3sVU9wFBmgw.srEHrgIYvGIixGPvMXhqXBHT.AjD68K';
    const password = 'password123';

    const match = await bcrypt.compare(password, hash);
    console.log(match ? '✅ Password matches!' : '❌ Password does not match!');
}

test();
