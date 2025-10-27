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
  assert(typeof mainModule.isValidGitUrl === 'function', 'Should export isValidGitUrl function');
  assert(typeof mainModule.isValidNpmPackageName === 'function', 'Should export isValidNpmPackageName function');
  assert(typeof mainModule.replaceTokens === 'function', 'Should export replaceTokens function');
  assert(typeof mainModule.handleCIFiles === 'function', 'Should export handleCIFiles function');
  assert(typeof mainModule.generateAppConfig === 'function', 'Should export generateAppConfig function');
  assert(typeof mainModule.extractRealm === 'function', 'Should export extractRealm function');

  // Test URL validation
  assert(mainModule.isValidGitUrl('https://github.com/user/repo.git') === true, 'Should accept valid HTTPS git URL');
  assert(mainModule.isValidGitUrl('git@github.com:user/repo.git') === true, 'Should accept valid SSH git URL');
  assert(mainModule.isValidGitUrl('https://github.com/user/repo') === true, 'Should accept valid HTTPS URL without .git');
  assert(mainModule.isValidGitUrl('invalid url') === false, 'Should reject invalid URL');
  assert(mainModule.isValidGitUrl('') === false, 'Should reject empty URL');

  // Test npm package name validation
  assert(mainModule.isValidNpmPackageName('my-app') === true, 'Should accept valid package name');
  assert(mainModule.isValidNpmPackageName('my-app-123') === true, 'Should accept package name with numbers');
  assert(mainModule.isValidNpmPackageName('MyApp') === false, 'Should reject uppercase letters');
  assert(mainModule.isValidNpmPackageName('my app') === false, 'Should reject spaces');
  assert(mainModule.isValidNpmPackageName('my_app') === false, 'Should reject underscores');

  // Test realm extraction
  assert(mainModule.extractRealm('https://idp.example.com/realms/test-realm') === 'test-realm', 'Should extract realm from URL');
  assert(mainModule.extractRealm('https://idp.example.com') === 'my-realm', 'Should return default realm if not found');

  console.log('✅ Test 3 passed: Main module exports correct functions and validates inputs');
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
