const http = require('http');
const { URL } = require('url');

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  const match = pathname.match(/^\/helloworld\/([^\/]+)$/);
  if (match) {
    let nameParam = match[1];
    try {
      nameParam = decodeURIComponent(nameParam);
    } catch (_) {
      // leave as-is if decoding fails
    }

    const responseBody = { message: `hello worlld ${nameParam}` };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(responseBody));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Attempt to listen on the desired port; fall back to a random port if busy
const envPort = Number(process.env.PORT) || 3000;
let currentPort = envPort;

function startServer(portToUse) {
  server.listen(portToUse);
}

server.on('listening', () => {
  const address = server.address();
  const actualPort = typeof address === 'string' ? address : address.port;
  console.log(`Server listening on http://localhost:${actualPort}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    if (currentPort !== 0) {
      console.warn(`Port ${currentPort} in use, retrying with a random port...`);
      currentPort = 0; // 0 asks OS for an available port
      setTimeout(() => startServer(currentPort), 10);
      return;
    }
  }
  throw err;
});

startServer(currentPort);
