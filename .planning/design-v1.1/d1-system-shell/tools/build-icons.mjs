import fs from 'node:fs'
const OUT = 'C:/gecko-cabane/.claude/worktrees/agent-aac5029c88381e664/.planning/design-v1.1/d1-system-shell'
function icon(name, flags) {
  const svg = fs.readFileSync(`node_modules/lucide-static/icons/${name}.svg`, 'utf8')
  const inner = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').replace(/\s+/g, ' ').trim()
  const f = (flags || '').split(' ').filter(Boolean)
  const cls = ['i']
  if (f.includes('sm')) cls.push('i-sm')
  if (f.includes('lg')) cls.push('i-lg')
  if (f.includes('spin')) cls.push('adm-spin')
  if (f.includes('status')) cls.push('i-status')
  return `<svg class="${cls.join(' ')}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`
}
for (const [src, dst] of [['kit.src.html', 'kit.html'], ['shell.src.html', 'shell.html']]) {
  const html = fs.readFileSync('src/' + src, 'utf8').replace(/\[\[([a-z0-9-]+)(?:\|([a-z ]+))?\]\]/g, (_, n, f) => icon(n, f))
  fs.writeFileSync(`${OUT}/${dst}`, html)
  console.log(dst, html.length)
}
