const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19006;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    // Serve the mobile web interface
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.readFile(path.join(__dirname, 'web.html'), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Mobile app not found');
        return;
      }
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Mobile app preview running on http://localhost:${PORT}`);
  console.log('Access your mobile app interface in the browser');
});

server.on('error', (err) => {
  console.error('Mobile server error:', err);
});