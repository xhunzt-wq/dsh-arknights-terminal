import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageName = '@dsh-external/dsh-client-ui-skin-arknights-terminal'
const assets = {
  ARKNIGHTS_HERO_DAY: 'assets/arknights-hero-forest-v2.webp',
  ARKNIGHTS_HERO_NIGHT: 'assets/arknights-hero-night-v3.webp',
  ARKNIGHTS_WORKSPACE_LIGHT: 'assets/arknights-workspace-deck-light-v3.webp',
  ARKNIGHTS_WORKSPACE_DARK: 'assets/arknights-workspace-deck-dark-v3.webp',
  ARKNIGHTS_RED_OPERATOR: 'assets/arknights-red-operator-v3.webp',
}

const dataUri = async relative => `data:image/webp;base64,${(await readFile(resolve(root, relative))).toString('base64')}`

await mkdir(resolve(root, 'lib'), { recursive: true })
let source = await readFile(resolve(root, 'src/client/index.js'), 'utf8')
source = source.replace('export function apply', 'function apply')
const constants = []
for (const [name, file] of Object.entries(assets)) constants.push(`const ${name} = ${JSON.stringify(await dataUri(file))};`)
const css = await readFile(resolve(root, 'src/client/arknights-terminal.css'), 'utf8')
const client = `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(packageName)},\n  factory: (require) => {\n    var module = { exports: {} };\n    var exports = module.exports;\n    ${constants.join('\n    ')}\n    const css = ${JSON.stringify(css)};\n    const tagId = ${JSON.stringify(packageName + '/arknights-terminal.css')};\n    const installSkinStyles = () => {\n      let tag = document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']');\n      if (!tag) {\n        tag = document.createElement('style');\n        tag.dataset.plugin = ${JSON.stringify(packageName)};\n        tag.dataset.pluginCss = tagId;\n        document.head.appendChild(tag);\n      }\n      tag.textContent = css;\n      return () => { if (tag?.dataset.plugin === ${JSON.stringify(packageName)}) tag.remove(); };\n    };\n    ${source}\n    exports.apply = apply;\n    return module.exports;\n  }\n});\n`
await writeFile(resolve(root, 'lib/client.js'), client)
await writeFile(resolve(root, 'lib/index.js'), '/** Host-side entry. */\nfunction apply() {}\nexport { apply };\n')
console.log(`built ${basename(root)}/lib/client.js (${Math.round(client.length / 1024)} KiB)`)
