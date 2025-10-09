const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from test service!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
});

server.listen(3001, () => {
  console.log('Test service running on http://localhost:3001');
});