const http = require('http');

const BASE = 'http://localhost:5000/api';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const url = new URL(BASE + path);
    opts.hostname = url.hostname;
    opts.port = url.port;
    opts.path = url.pathname + url.search;

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== Backend API Smoke Test ===\n');
  let token;

  // 1. Login
  const login = await request('POST', '/auth/login', { email: 'admin@trends-bird.com', password: 'admin123' });
  if (login.status === 200) {
    token = login.body.data.accessToken;
    console.log(`✅ 1. POST /auth/login → 200 (token obtained)`);
  } else {
    console.log(`❌ 1. POST /auth/login → ${login.status}: ${JSON.stringify(login.body.message)}`);
    return;
  }

  const tests = [
    ['GET', '/auth/me',       null, r => `email=${r.data?.email}, perms=${r.data?.permissions?.length}`],
    ['GET', '/categories',    null, r => `total=${r.pagination?.total}`],
    ['GET', '/brands',        null, r => `total=${r.pagination?.total}`],
    ['GET', '/products',      null, r => `total=${r.pagination?.total}`],
    ['GET', '/attributes',    null, r => `total=${r.pagination?.total}`],
    ['GET', '/users',         null, r => `total=${r.pagination?.total}`],
    ['GET', '/roles',         null, r => `count=${r.data?.length}`],
    ['GET', '/permissions',   null, r => `count=${r.data?.length}`],
    ['GET', '/media',         null, r => `total=${r.pagination?.total}`],
  ];

  for (let i = 0; i < tests.length; i++) {
    const [method, path, body, describe] = tests[i];
    const res = await request(method, path, body, token);
    const num = i + 2;
    if (res.status >= 200 && res.status < 300) {
      console.log(`✅ ${num}. ${method} ${path} → ${res.status} (${describe(res.body)})`);
    } else {
      console.log(`❌ ${num}. ${method} ${path} → ${res.status}: ${JSON.stringify(res.body?.message || res.body)}`);
    }
  }

  console.log('\n=== Smoke Test Complete ===');
}

main().catch(console.error);
