const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Sample Buddy for Windows...');

try {
  // Step 1: Build React app
  console.log('📦 Building React application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Copy built files to electron directory
  console.log('📋 Copying built files to electron directory...');
  const electronDir = path.join(__dirname, 'electron');
  const distDir = path.join(__dirname, 'dist');
  const electronDistDir = path.join(electronDir, 'dist');
  
  // Remove existing dist in electron folder
  if (fs.existsSync(electronDistDir)) {
    fs.rmSync(electronDistDir, { recursive: true, force: true });
  }
  
  // Copy dist folder to electron
  fs.cpSync(distDir, electronDistDir, { recursive: true });
  
  // Step 3: Install electron dependencies
  console.log('⚡ Installing Electron dependencies...');
  execSync('npm install', { cwd: electronDir, stdio: 'inherit' });

  // Step 4: Build executable
  console.log('🚀 Building Windows executable...');
  execSync('npm run dist', { cwd: electronDir, stdio: 'inherit' });

  console.log('✅ Build completed! Check the electron/dist folder for your .exe file');
  console.log('📁 Your executable will be in: electron/dist/Sample Buddy Setup.exe');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}