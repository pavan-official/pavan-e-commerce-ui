#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix syntax errors in a file
function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix function parameter destructuring syntax errors
    // Pattern: functionName(_{ params }: { params: { ... } })
    // Replace with: functionName({ params }: { params: { ... } })
    const destructuringPattern = /(\w+)\s*\(\s*_{([^}]+)}\s*:\s*([^)]+)\)/g;
    const newContent = content.replace(destructuringPattern, (match, funcName, params, type) => {
      modified = true;
      return `${funcName}({${params}}: ${type})`;
    });

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed syntax errors in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and fix TypeScript files
function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.next', '.git'].includes(file)) {
        fixedCount += findAndFixFiles(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (fixSyntaxErrors(filePath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Main execution
console.log('🔧 Starting syntax error fixes...');
const fixedCount = findAndFixFiles('./src');
console.log(`✅ Fixed syntax errors in ${fixedCount} files`);
console.log('🎉 Syntax error fixes completed!');
