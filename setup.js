#!/usr/bin/env node

/**
 * Library App Setup Script
 * 
 * This script helps new developers set up the Library App project quickly.
 * It checks for prerequisites, creates necessary directories, and guides
 * through the configuration process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n\x1b[36m=== Library App Setup ===\x1b[0m\n');
console.log('This script will help you set up the Library App project.\n');

// Function to run commands and handle errors
function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\x1b[31mCommand failed: ${command}\x1b[0m`);
    return false;
  }
}

// Check if Expo CLI is installed
function checkExpo() {
  try {
    execSync('expo --version', { stdio: 'ignore' });
    console.log('\x1b[32m✓ Expo CLI is installed\x1b[0m');
    return true;
  } catch (error) {
    console.log('\x1b[33m⚠ Expo CLI is not installed. Would you like to install it now? (y/n)\x1b[0m');
    rl.question('> ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\nInstalling Expo CLI...');
        if (runCommand('npm install -g expo-cli')) {
          console.log('\x1b[32m✓ Expo CLI installed successfully\x1b[0m');
          continueSetup();
        } else {
          console.log('\x1b[31m✗ Failed to install Expo CLI. Please install it manually: npm install -g expo-cli\x1b[0m');
          continueSetup();
        }
      } else {
        console.log('\x1b[33m⚠ Please install Expo CLI manually before continuing.\x1b[0m');
        continueSetup();
      }
    });
    return false;
  }
}

// Create placeholder images
function createPlaceholderImages() {
  console.log('\nCreating placeholder images...');
  try {
    // Call the create-placeholder-images.js script
    require('./create-placeholder-images.js');
    return true;
  } catch (error) {
    console.error('\x1b[31mFailed to create placeholder images. Error: ', error, '\x1b[0m');
    return false;
  }
}

// Install dependencies
function installDependencies() {
  console.log('\nInstalling dependencies...');
  return runCommand('npm install');
}

// Configure Firebase
function configureFirebase() {
  console.log('\n\x1b[36m=== Firebase Configuration ===\x1b[0m');
  console.log('\nYou need to set up a Firebase project for authentication and database.');
  console.log('1. Go to https://firebase.google.com/ and create a new project');
  console.log('2. Enable Authentication with Email/Password method');
  console.log('3. Create a Firestore database');
  console.log('4. Get your Firebase configuration from Project Settings > Your apps');
  console.log('\nWould you like to configure Firebase now? (y/n)');
  
  rl.question('> ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('\nPlease enter your Firebase configuration:');
      
      rl.question('API Key: ', (apiKey) => {
        rl.question('Auth Domain: ', (authDomain) => {
          rl.question('Project ID: ', (projectId) => {
            rl.question('Storage Bucket: ', (storageBucket) => {
              rl.question('Messaging Sender ID: ', (messagingSenderId) => {
                rl.question('App ID: ', (appId) => {
                  
                  // Read the firebase.js file
                  const firebasePath = path.join(__dirname, 'src', 'services', 'firebase.js');
                  let firebaseContent = fs.readFileSync(firebasePath, 'utf8');
                  
                  // Replace the placeholder configuration
                  firebaseContent = firebaseContent.replace(
                    /const firebaseConfig = {[\s\S]*?};/,
                    `const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};`
                  );
                  
                  // Write back to the file
                  fs.writeFileSync(firebasePath, firebaseContent);
                  
                  console.log('\x1b[32m✓ Firebase configuration updated successfully\x1b[0m');
                  finishSetup();
                });
              });
            });
          });
        });
      });
    } else {
      console.log('\x1b[33m⚠ Please configure Firebase manually in src/services/firebase.js\x1b[0m');
      finishSetup();
    }
  });
}

// Continue setup after Expo check
function continueSetup() {
  // Create placeholder images
  if (createPlaceholderImages()) {
    console.log('\x1b[32m✓ Placeholder images created successfully\x1b[0m');
  }
  
  // Install dependencies
  if (installDependencies()) {
    console.log('\x1b[32m✓ Dependencies installed successfully\x1b[0m');
    configureFirebase();
  } else {
    console.log('\x1b[31m✗ Failed to install dependencies. Please try running npm install manually.\x1b[0m');
    configureFirebase();
  }
}

// Finish setup
function finishSetup() {
  console.log('\n\x1b[36m=== Setup Complete ===\x1b[0m');
  console.log('\nYou can now start the app with:');
  console.log('\x1b[32mnpm start\x1b[0m');
  console.log('\nRefer to INSTALL.md and README.md for more information.');
  console.log('\nHappy coding! 📚📱\n');
  rl.close();
}

// Start the setup process
if (checkExpo()) {
  continueSetup();
}