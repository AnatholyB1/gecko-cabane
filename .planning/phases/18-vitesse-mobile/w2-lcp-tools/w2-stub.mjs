import http from 'node:http'
http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'application/json', 'content-range': '*/0' }); res.end('[]') }).listen(3108, '127.0.0.1', () => console.log('stub up'))
