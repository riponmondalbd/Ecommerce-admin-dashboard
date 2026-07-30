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

req('POST', '/api/auth/login', { email: 'admin@trends-bird.com', password: 'admin123' })
  .then(r => {
    const t = r.body.data.accessToken;
    return req('GET', '/api/roles', null, t);
  })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error);
