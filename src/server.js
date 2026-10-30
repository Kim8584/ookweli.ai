/**
 * ProofPocket Native HTTP Application Server
 * Serves developer UI and provides REST API for QVAC & Jolt Atlas zkML.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQvacDiagnostics } from './qvac_telemetry.js';
import { processProofPocketPipeline } from './proofpocket.js';
import { runZkmlProof } from './zkml_prover.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PUBLIC_HTML = resolve(__dirname, 'public', 'index.html');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    // 1. Serve Web UI
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(PUBLIC_HTML, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // 2. GET /api/status
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'ONLINE',
        project: 'ProofPocket (Ookweli)',
        version: '1.0.0',
        qvacStack: 'Tether QVAC SDK (@qvac/sdk)',
        zkmlProver: 'Jolt Atlas zkML (HyperKZG / BN254)',
        level: 'LEVEL_1_IDEAL',
        network: 'AIR_GAPPED_OFFLINE'
      });
    }

    // 3. GET /api/resources
    if (url.pathname === '/api/resources' && req.method === 'GET') {
      const diagnostics = await getQvacDiagnostics();
      return sendJson(res, 200, diagnostics);
    }

    // 4. POST /api/execute
    if (url.pathname === '/api/execute' && req.method === 'POST') {
      const payload = await parseBody(req);
      const result = await processProofPocketPipeline({
        text: payload.text,
        scenarioId: payload.scenarioId || 'custom',
        skipZkml: payload.skipZkml === true
      });
      return sendJson(res, 200, result);
    }

    // 5. POST /api/prove
    if (url.pathname === '/api/prove' && req.method === 'POST') {
      const result = await runZkmlProof({ withStats: true });
      return sendJson(res, 200, result);
    }

    // 404 Handler
    return sendJson(res, 404, { error: 'Not Found', path: url.pathname });
  } catch (err) {
    console.error('Server error handling request:', err);
    return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` ProofPocket Server listening on http://localhost:${PORT}`);
  console.log(` Tether QVAC + Jolt Atlas zkML Local Pipeline Ready`);
  console.log(`=======================================================`);
});

export default server;
