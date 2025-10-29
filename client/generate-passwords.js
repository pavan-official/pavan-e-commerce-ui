const bcrypt = require('bcryptjs');

async function generatePasswords() {
  console.log('Generating password hashes...');
  
  const adminPassword = 'admin123';
  const testPassword = 'password';
  
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const testHash = await bcrypt.hash(testPassword, 10);
  
  console.log('Admin password hash:', adminHash);
  console.log('Test password hash:', testHash);
  
  // Verify the hashes work
  const adminVerify = await bcrypt.compare(adminPassword, adminHash);
  const testVerify = await bcrypt.compare(testPassword, testHash);
  
  console.log('Admin password verification:', adminVerify);
  console.log('Test password verification:', testVerify);
}

generatePasswords().catch(console.error);
