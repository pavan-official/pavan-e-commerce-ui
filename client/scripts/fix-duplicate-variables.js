#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing duplicate variable declarations...');

// Get all TypeScript files
const files = [
  ...glob.sync('src/app/api/**/*.ts', { cwd: process.cwd() }),
  ...glob.sync('src/**/*.ts', { cwd: process.cwd() })
];

function fixDuplicateVariables(content) {
  // Pattern to find duplicate user variable declarations
  const duplicateUserPattern = /const user = await getServerUser\(request\)[\s\S]*?const user = await prisma\.user\.findUnique\(/g;
  
  // Replace with single user declaration and role check
  content = content.replace(duplicateUserPattern, (match) => {
    // Extract the first part (getServerUser call)
    const firstPart = match.match(/const user = await getServerUser\(request\)[\s\S]*?if \(!user\) \{[\s\S]*?\}/)[0];
    
    // Add role check instead of duplicate user query
    return firstPart + `
    // Check if user is admin
    if (user.role !== 'ADMIN') {`;
  });
  
  // Fix remaining patterns
  content = content.replace(
    /const user = await prisma\.user\.findUnique\(\s*\{\s*where: \{ id: user\.id \},\s*select: \{ role: true \},\s*\}\)\s*if \(user\?\.role !== 'ADMIN'\)/g,
    "if (user.role !== 'ADMIN')"
  );
  
  return content;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    content = fixDuplicateVariables(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

files.forEach(processFile);
console.log('✅ Duplicate variable fix complete!');
