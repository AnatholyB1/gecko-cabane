// node w2-insp.mjs file.json : LCP element/phases, render-blocking, font+css requests
import fs from 'node:fs'
const l = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const a = l.audits
console.log('perf', l.categories.performance.score, 'lcp', Math.round(a['largest-contentful-paint'].numericValue), 'fcp', Math.round(a['first-contentful-paint'].numericValue))
const el = a['largest-contentful-paint-element']?.details?.items
console.log('LCP el', JSON.stringify(el?.[0]?.items?.[0]?.node?.snippet), JSON.stringify(el?.[1]?.items))
console.log('render-blocking', JSON.stringify(a['render-blocking-resources']?.details?.items?.map((x) => [x.url.replace('http://localhost:3108', ''), Math.round(x.totalBytes), Math.round(x.wastedMs)])))
console.log('lcp-breakdown', JSON.stringify(a['lcp-breakdown-insight']?.details?.items ?? a['lcp-phases']?.details?.items ?? 'n/a').slice(0, 600))
const nr = a['network-requests'].details.items
for (const x of nr) console.log(Math.round(x.networkRequestTime), Math.round(x.networkEndTime), x.resourceType, Math.round(x.transferSize / 1024) + 'K', x.priority, x.url.replace('http://localhost:3108', '').slice(0, 80))
console.log('bootup', JSON.stringify(a['bootup-time'].details.items.slice(0, 6).map((x) => [x.url.replace('http://localhost:3108', '').slice(0, 50), Math.round(x.total), Math.round(x.scripting)])))
console.log('longtasks', JSON.stringify(a['long-tasks']?.details?.items?.slice(0, 10).map((x) => [x.url.replace('http://localhost:3108', '').slice(0, 50), Math.round(x.startTime), Math.round(x.duration)])))
console.log('mainthread', JSON.stringify(a['mainthread-work-breakdown'].details.items.slice(0, 5).map((x) => [x.groupLabel, Math.round(x.duration)])))
