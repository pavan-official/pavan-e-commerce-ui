#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing all duplicate variable declarations...');

// Get all TypeScript files
const files = [
  ...glob.sync('src/app/api/**/*.ts', { cwd: process.cwd() }),
  ...glob.sync('src/**/*.ts', { cwd: process.cwd() })
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: Fix duplicate user declarations in admin routes
    const duplicateUserPattern = /const user = await getServerUser\(request\)[\s\S]*?if \(!user\) \{[\s\S]*?\}[\s\S]*?\/\/ Check if user is admin[\s\S]*?const user = await prisma\.user\.findUnique\(\s*\{\s*where: \{ id: user\.id \},\s*select: \{ role: true \},\s*\}\)[\s\S]*?if \(user\?\.role !== 'ADMIN'\)/g;
    
    if (duplicateUserPattern.test(content)) {
      content = content.replace(duplicateUserPattern, (match) => {
        // Extract the first part (getServerUser call and auth check)
        const firstPart = match.match(/const user = await getServerUser\(request\)[\s\S]*?if \(!user\) \{[\s\S]*?\}/)[0];
        
        // Replace with single user declaration and role check
        return firstPart + `
    // Check if user is admin
    if (user.role !== 'ADMIN') {`;
      });
      modified = true;
    }
    
    // Pattern 2: Fix remaining duplicate user patterns
    content = content.replace(
      /const user = await prisma\.user\.findUnique\(\s*\{\s*where: \{ id: user\.id \},\s*select: \{ role: true \},\s*\}\)\s*if \(user\?\.role !== 'ADMIN'\)/g,
      "if (user.role !== 'ADMIN')"
    );
    
    // Pattern 3: Fix any remaining duplicate user declarations
    content = content.replace(
      /\/\/ Check if user is admin\s*const user = await prisma\.user\.findUnique\(\s*\{\s*where: \{ id: user\.id \},\s*select: \{ role: true \},\s*\}\)\s*if \(user\?\.role !== 'ADMIN'\)/g,
      "// Check if user is admin\n    if (user.role !== 'ADMIN')"
    );
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

files.forEach(fixFile);
console.log('✅ All duplicate variable fixes complete!');
