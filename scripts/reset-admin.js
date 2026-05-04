const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getPool, query } = require('../lib/db');

async function resetAdmin() {
  const newEmail = 'libralegalconsultancy@gmail.com';
  const newPassword = 'libralegal';
  const newFullName = 'Libra Legal Admin';

  console.log(`Starting admin user reset process...`);
  
  try {
    // 1. Hash the new password
    console.log('Hashing new password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 2. Delete existing admin users
    console.log('Deleting current admin users...');
    await query('DELETE FROM admin_users');

    // 3. Insert the new admin user
    console.log(`Adding new admin user: ${newEmail}`);
    await query(
      'INSERT INTO admin_users (email, password_hash, full_name, is_active) VALUES (?, ?, ?, 1)',
      [newEmail, passwordHash, newFullName]
    );

    console.log('Admin user successfully updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin user:', error);
    process.exit(1);
  }
}

resetAdmin();
