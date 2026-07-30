const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'localhost',
      port: 5000,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const r = http.request(opts, (rs) => {
      let d = '';
      rs.on('data', c => d += c);
      rs.on('end', () => resolve({ status: rs.statusCode, body: JSON.parse(d) }));
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function main() {
  const login = await req('POST', '/api/auth/login', { email: 'admin@trends-bird.com', password: 'admin123' });
  const token = login.body.data.accessToken;

  const cats = await req('GET', '/api/categories', null, token);
  
  console.log('=== Real Data Verification ===');
  console.log('Categories body keys:', Object.keys(cats.body));
  console.log('Categories body data type:', Array.isArray(cats.body.data) ? 'Array' : typeof cats.body.data);
  console.log('Categories body full:', JSON.stringify(cats.body, null, 2).substring(0, 500));
}

main().catch(console.error);
