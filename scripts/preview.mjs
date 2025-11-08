import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const PORT = process.env.PORT || 4173;
const distDir = resolve('dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = req.url && req.url !== '/' ? req.url : '/index.html';
    const filePath = join(distDir, urlPath.split('?')[0]);

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      sendNotFound(res);
      return;
    }

    const ext = extname(filePath);
    const type = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Preview server is running at http://localhost:${PORT}`);
});
