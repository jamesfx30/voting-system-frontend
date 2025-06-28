// generateHash.js
const bcrypt = require('bcryptjs'); // Make sure bcryptjs is installed (npm install bcryptjs)

const passwordToHash = 'oppongfx40'; // <--- IMPORTANT: REPLACE THIS with the actual password you want for your admin user

bcrypt.hash(passwordToHash, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Your bcrypt hash is:');
    console.log(hash); // This is the hash you need to copy
});