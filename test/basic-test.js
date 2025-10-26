/**
 * Basic test file to validate the CLI structure
 * Run with: node test/basic-test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Running basic structure tests...\n');

// Test 1: Check package.json exists and is valid
try {
  const packagePath = path.join(__dirname, '../package.json');
  assert(fs.existsSync(packagePath), 'package.json should exist');
  
  const packageJson = require('../package.json');
  assert(packageJson.name === 'angular-starter-cli', 'Package name should be angular-starter-cli');
  assert(packageJson.bin['angular-starter'] === './bin/cli.js', 'Binary should point to ./bin/cli.js');
  
  console.log('✅ Test 1 passed: package.json is valid');
} catch (error) {
  console.error('❌ Test 1 failed:', error.message);
  process.exit(1);
}

// Test 2: Check CLI entry point exists
try {
  const cliPath = path.join(__dirname, '../bin/cli.js');
  assert(fs.existsSync(cliPath), 'CLI entry point should exist');
  
  const cliContent = fs.readFileSync(cliPath, 'utf8');
  assert(cliContent.includes('#!/usr/bin/env node'), 'CLI should have shebang');
  assert(cliContent.includes('commander'), 'CLI should use commander');
  
  console.log('✅ Test 2 passed: CLI entry point is valid');
} catch (error) {
  console.error('❌ Test 2 failed:', error.message);
  process.exit(1);
}

// Test 3: Check main module exists and exports functions
try {
  const mainModule = require('../src/index.js');
  assert(typeof mainModule.createAngularStarter === 'function', 'Should export createAngularStarter function');
  assert(typeof mainModule.cloneTemplate === 'function', 'Should export cloneTemplate function');
  assert(typeof mainModule.customizeProject === 'function', 'Should export customizeProject function');
  
  console.log('✅ Test 3 passed: Main module exports correct functions');
} catch (error) {
  console.error('❌ Test 3 failed:', error.message);
  process.exit(1);
}

// Test 4: Check .gitignore exists
try {
  const gitignorePath = path.join(__dirname, '../.gitignore');
  assert(fs.existsSync(gitignorePath), '.gitignore should exist');
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('node_modules'), '.gitignore should include node_modules');
  
  console.log('✅ Test 4 passed: .gitignore is valid');
} catch (error) {
  console.error('❌ Test 4 failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed!\n');
