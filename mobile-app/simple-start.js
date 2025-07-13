const { spawn } = require('child_process');
const fs = require('fs');

// Kill any existing npm install processes
console.log('Starting mobile app preview...');

// Check if basic dependencies exist
if (fs.existsSync('node_modules/expo')) {
  console.log('Dependencies found, starting Expo web...');
  startExpo();
} else {
  console.log('Installing minimal dependencies...');
  const install = spawn('npm', ['install', 'expo', 'react', 'react-dom', 'react-native-web', '--no-audit', '--no-fund'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startExpo();
    } else {
      console.error('Failed to install dependencies');
    }
  });
}

function startExpo() {
  const expo = spawn('npx', ['expo', 'start', '--web', '--port', '19006', '--no-dev-client'], {
    stdio: 'inherit',
    cwd: __dirname
  });
}