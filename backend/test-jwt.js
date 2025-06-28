// backend/test-jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' }); // Make sure .env is loaded

const testSecret = process.env.JWT_SECRET || 'fallback_secret_for_testing'; // Use your actual secret or a fallback
const testPayload = { id: 999, email: 'test@example.com' }; // Just some dummy data

console.log('--- JWT Test Script ---');
console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'NOT LOADED - Check your .env file!');
console.log('Secret value (first 10 chars):', testSecret.substring(0, 10) + '...');

try {
    // Attempt to sign a token with 3-minute expiry
    const testToken = jwt.sign(
        testPayload,
        testSecret,
        { expiresIn: '3m' }
    );

    const decoded = jwt.decode(testToken);

    console.log('\n--- Generated Token Details ---');
    console.log('Token (first 20 chars):', testToken.substring(0, 20) + '...');
    console.log('Decoded Payload:', decoded);

    // Convert timestamps to human-readable dates for easy verification
    const iatDate = new Date(decoded.iat * 1000);
    const expDate = new Date(decoded.exp * 1000);

    console.log('Issued At (IAT):', iatDate.toISOString());
    console.log('Expires At (EXP):', expDate.toISOString());
    console.log('Expected Expiry Duration:', '3 minutes');
    console.log('Calculated Duration (seconds):', decoded.exp - decoded.iat);


} catch (error) {
    console.error('\n--- JWT Test Error ---');
    console.error('An error occurred during JWT signing:', error.message);
}

console.log('--- End JWT Test Script ---');