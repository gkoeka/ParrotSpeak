import { spawn } from 'child_process';
import http from 'http';

console.log('ParrotSpeak Mobile-First Setup');

// Mobile preview HTML wrapper
const mobileHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParrotSpeak Mobile</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .mobile-container {
            width: 100%;
            max-width: 414px;
            height: 896px;
            background: #1a1a1a;
            border-radius: 40px;
            padding: 8px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.5);
            position: relative;
        }
        .mobile-screen {
            width: 100%;
            height: 100%;
            background: white;
            border-radius: 32px;
            overflow: hidden;
            position: relative;
        }
        .notch {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 30px;
            background: #1a1a1a;
            border-radius: 0 0 15px 15px;
            z-index: 10;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 32px;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #666;
            z-index: 5;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
            body { padding: 0; }
            .mobile-container {
                max-width: 100%;
                height: 100vh;
                border-radius: 0;
                padding: 0;
                box-shadow: none;
            }
            .mobile-screen {
                border-radius: 0;
            }
            .notch { display: none; }
        }
        .status-indicator {
            position: absolute;
            top: 10px;
            right: 15px;
            color: #00ff00;
            font-size: 12px;
            z-index: 20;
            background: rgba(0,0,0,0.7);
            padding: 4px 8px;
            border-radius: 12px;
        }
    </style>
</head>
<body>
    <div class="mobile-container">
        <div class="notch"></div>
        <div class="status-indicator">● MOBILE DEFAULT</div>
        <div class="mobile-screen">
            <div class="loading">
                <div class="spinner"></div>
                <h3>ParrotSpeak Mobile</h3>
                <p>Loading voice translation interface...</p>
            </div>
            <iframe src="http://localhost:5001" onload="document.querySelector('.loading').style.display='none'"></iframe>
        </div>
    </div>
</body>
</html>`;

// Start backend on port 5001
const backend = spawn('tsx', ['server/index.ts'], {
  env: { ...process.env, PORT: '5001' },
  stdio: ['inherit', 'pipe', 'pipe']
});

backend.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) console.log(output);
});

backend.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) console.error(output);
});

// Mobile preview server on port 5000 (default workflow port)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(mobileHTML);
});

server.listen(5000, () => {
  console.log('Mobile Preview (Default): http://localhost:5000');
  console.log('Backend API: http://localhost:5001');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  server.close();
});

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  server.close();
});