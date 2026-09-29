const http = require('http');

const req = http.request(
  {
    host: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    headers: {
      Origin: 'http://localhost:8080',
    },
  },
  (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      console.log('Status for unauthorized origin:', res.statusCode);
      console.log('Response body:', body);
      console.log('Access-Control-Allow-Origin header:', res.headers['access-control-allow-origin']);
    });
  }
);
req.end();
