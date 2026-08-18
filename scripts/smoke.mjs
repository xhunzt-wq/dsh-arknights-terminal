import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })

await page.setContent(`<!doctype html><html><head><meta name="theme-color" content="#fff"><style>
*{box-sizing:border-box}html,body,#root{width:100%;height:100%;margin:0;font:14px system-ui;color:#202528}body{overflow:hidden}
.frame{height:100%;display:grid;grid-template-rows:32px 1fr}.titlebar{display:flex;align-items:center;padding:0 16px}.shell{display:grid;grid-template-columns:280px 1fr;height:100%}.sidebarCol>div{height:100%;padding:10px}.brand{padding:12px 4px;font-weight:800}.newSession{width:100%;padding:10px;margin:8px 0 18px}.workspace{padding:9px;margin:4px 0}.workspace[aria-selected=true]{background:#ffffff14}.main{position:relative;overflow:hidden}.hero{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}.headline{font-size:42px;font-weight:800;color:#eef3f2;text-shadow:0 2px 10px #000}.subtitle{color:#dae2e1;margin:8px 0 60px}.composerCard{width:min(700px,60vw);height:180px;padding:24px;color:#202528}.composerCard textarea{width:100%;height:85px;border:0;background:transparent;resize:none;font:16px system-ui}.toolbar{display:flex;justify-content:space-between}.chip{padding:6px 12px;background:#d54a3f;color:white}.footer{position:absolute;bottom:22px;color:#dbe3e2;font:10px ui-monospace;letter-spacing:.2em}
</style></head><body><div id="root"><div class="frame" data-wco><div class="titlebar">DEEPSEEK HARNESS</div><div class="shell"><aside class="sidebarCol" data-pane="sidebar"><div><div class="brand">DEEPSEEK // HARNESS</div><button class="newSession">＋ 新会话</button><div>工作区 / OPERATIONS</div><div role="tree"><div class="workspace" role="treeitem" aria-expanded="true">◈ Rhodes Island</div><div class="workspace" role="treeitem" aria-selected="true">当前会话</div><div class="workspace" role="treeitem" aria-selected="false">任务档案 01</div></div></div></aside><main class="main"><section class="hero" data-phase="hero"><div class="headline">连接至罗德岛终端</div><div class="subtitle">TACTICAL INTELLIGENCE ASSISTANT</div><div class="composerCard" data-composer-card><textarea placeholder="输入任务或问题…"></textarea><div class="toolbar"><span class="chip">OPS READY</span><button>发送 ↑</button></div></div><div class="footer">SECURE CHANNEL // DSH-01</div></section></main></div></div></div></body></html>`)

await page.evaluate(() => {
  window.__loadedSkin = null
  window.__skinDisposers = []
  window.__ModuleLoader__ = { load(definition) { window.__loadedSkin = definition.factory(() => ({})) } }
})
await page.addScriptTag({ path: resolve(root, 'lib/client.js') })
const result = await page.evaluate(async () => {
  window.__loadedSkin.apply({ effect(fn) { window.__skinDisposers.push(fn()) } })
  const mounted = {
    bodyAttr: document.body.hasAttribute('data-dsh-arknights-terminal'),
    scenes: document.querySelectorAll("[data-skin-chrome='scene']").length,
    characters: document.querySelectorAll("[data-ak-layer='character']").length,
    hud: document.querySelectorAll("[data-skin-chrome='hud']").length,
    mark: document.querySelectorAll("[data-skin-chrome='sidebar-mark']").length,
    frame: document.querySelectorAll("[data-skin-chrome='sidebar-frame']").length,
    workspaceRows: document.querySelectorAll('[data-ak-workspace-row]').length,
    sessionRows: document.querySelectorAll('[data-ak-session-row]').length,
    background: document.querySelector("[data-ak-layer='background']").style.backgroundImage.startsWith('url("data:image/webp;base64,'),
    backgroundRole: document.body.dataset.arknightsBackground,
    mode: document.body.dataset.arknightsMode,
    motion: document.body.dataset.arknightsMotion,
    styles: document.querySelectorAll("style[data-plugin='@dsh-external/dsh-client-ui-skin-arknights-terminal']").length,
  }
  document.querySelector("[data-phase='hero']").setAttribute('data-phase', 'active')
  await new Promise(resolve => setTimeout(resolve, 0))
  const workspaceBackgroundRole = document.body.dataset.arknightsBackground
  document.querySelector("[data-phase='active']").setAttribute('data-phase', 'hero')
  await new Promise(resolve => setTimeout(resolve, 0))
  document.body.setAttribute('data-ds-dark-theme', '')
  await new Promise(resolve => setTimeout(resolve, 0))
  const darkBackgroundRole = document.body.dataset.arknightsBackground
  const darkBackground = document.querySelector("[data-ak-layer='background']").style.backgroundImage.startsWith('url("data:image/webp;base64,')
  return { mounted, workspaceBackgroundRole, darkBackgroundRole, darkBackground }
})

if (!result.mounted.bodyAttr || result.mounted.scenes !== 1 || result.mounted.characters !== 1 || result.mounted.hud !== 1 || result.mounted.mark !== 1 || result.mounted.frame !== 1 || result.mounted.workspaceRows !== 1 || result.mounted.sessionRows !== 2 || !result.mounted.background || result.mounted.backgroundRole !== 'hero-light' || result.mounted.mode !== 'light' || result.mounted.styles !== 1 || result.workspaceBackgroundRole !== 'active-light' || result.darkBackgroundRole !== 'hero-dark' || !result.darkBackground) {
  throw new Error(`runtime smoke test failed: ${JSON.stringify(result.mounted)}`)
}
await page.screenshot({ path: resolve(root, 'preview/dark.png') })
await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
await page.waitForTimeout(30)
await page.screenshot({ path: resolve(root, 'preview/light.png') })

const clean = await page.evaluate(() => {
  window.__skinDisposers.forEach(fn => fn())
  return {
    bodyAttr: document.body.hasAttribute('data-dsh-arknights-terminal'),
    owned: document.querySelectorAll("[data-skin-owner='arknights-terminal']").length,
    decorated: document.querySelectorAll('[data-ak-workspace-row], [data-ak-session-row]').length,
    styles: document.querySelectorAll("style[data-plugin='@dsh-external/dsh-client-ui-skin-arknights-terminal']").length,
  }
})
if (clean.bodyAttr || clean.owned || clean.decorated || clean.styles) throw new Error(`dispose failed: ${JSON.stringify(clean)}`)
await browser.close()
console.log('smoke test passed: mount, assets, theme switch, chrome injection, dispose')
