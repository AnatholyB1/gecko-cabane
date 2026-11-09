// DIAGNOSTIC ONLY (never a score claim): next start in-process on 3108 where /_next/static/chunks/*.js are delivered after DELAY ms,
// to prove that Lighthouse's simulated LCP drops when the main bundle lands after the observed LCP paint (what a real network does).
// node w2-delay-server.mjs <wt> <delayMs>
import http from 'node:http'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
const [wt, delay] = process.argv.slice(2)
process.chdir(wt)
const require = createRequire(path.join(wt, 'package.json'))
const next = require('next')
const app = next({ dev: false, dir: wt, port: 3108, hostname: 'localhost' })
await app.prepare()
const handle = app.getRequestHandler()
const inject = process.env.W2_INJECT ? fs.readFileSync(process.env.W2_INJECT, 'utf8') : ''
http.createServer((req, res) => {
  if (inject && /^\/(fr|en)(\?|$)/.test(req.url)) {
    delete req.headers['accept-encoding']
    const w = res.write.bind(res), e = res.end.bind(res); let buf = ''
    res.write = (c) => { buf += c.toString(); return true }
    res.end = (c) => { if (c) buf += c.toString(); buf = buf.replace('</head>', inject + '</head>'); res.removeHeader('content-length'); res.removeHeader('content-encoding'); w(buf); e() }
    return handle(req, res)
  }
  if (/^\/_next\/static\/chunks\/.*\.js/.test(req.url)) setTimeout(() => handle(req, res), +delay)
  else handle(req, res)
}).listen(3108, () => console.log('delay server up'))
