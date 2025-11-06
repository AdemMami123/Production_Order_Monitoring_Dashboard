/**
 * Password Hash Generator
 * 
 * This script generates bcrypt hashes for passwords.
 * Use these hashes in your seed.sql file.
 * 
 * Usage:
 *   node generate-hash.js
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const PASSWORD = 'password123'; // Default password for seed users

async function generateHash() {
  console.log('🔐 Generating bcrypt password hash...\n');
  console.log(`Password: ${PASSWORD}`);
  console.log(`Salt Rounds: ${SALT_ROUNDS}\n`);

  try {
    const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    console.log('✅ Hash generated successfully!\n');
    console.log('Copy this hash to your seed.sql file:');
    console.log('─'.repeat(80));
    console.log(hash);
    console.log('─'.repeat(80));
    console.log('\nReplace the placeholder password_hash values in database/seed.sql');
    console.log('with the hash above.\n');

    // Generate a few more for different test users
    console.log('📝 Generating additional test passwords:\n');
    
    const testPasswords = ['admin123', 'manager123', 'worker123'];
    
    for (const pwd of testPasswords) {
      const testHash = await bcrypt.hash(pwd, SALT_ROUNDS);
      console.log(`Password: ${pwd}`);
      console.log(`Hash: ${testHash}\n`);
    }

  } catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateHash();
