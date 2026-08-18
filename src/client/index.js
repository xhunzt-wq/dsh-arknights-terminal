const SKIN_OWNER = 'arknights-terminal'
const SKIN_TITLE = '罗德岛终端 · DeepSeek Harness'
const BODY_ATTR = 'data-dsh-arknights-terminal'
const APPEARANCE_KEY = 'dsh-arknights-appearance'
const SIDEBAR_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"
const MOTION_SELECTOR = "[role='menu'],[role='listbox'],[role='dialog'],[role='tabpanel'],[role='tab'],[role='treeitem'],[aria-expanded],[aria-selected],[aria-checked]"

function owned(element) {
  return element?.closest?.(`[data-skin-owner='${SKIN_OWNER}'], [data-dsh-motion-ghost]`)
}

function preference() {
  let value
  try { value = localStorage.getItem(APPEARANCE_KEY) } catch { value = 'system' }
  return ['system', 'light', 'dark'].includes(value) ? value : 'system'
}

function resolveMode(body) {
  const saved = preference()
  if (saved !== 'system') return saved
  if (body.hasAttribute('data-ds-dark-theme') || body.dataset.theme === 'dark') return 'dark'
  if (body.hasAttribute('data-ds-light-theme') || body.dataset.theme === 'light') return 'light'
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function createScene() {
  const scene = document.createElement('div')
  scene.dataset.skinChrome = 'scene'
  scene.dataset.skinOwner = SKIN_OWNER
  scene.setAttribute('aria-hidden', 'true')
  scene.innerHTML = `
    <div data-ak-layer="background"></div>
    <div data-ak-layer="character-wrap">
      <img data-ak-layer="character" alt="" src="${ARKNIGHTS_RED_OPERATOR}">
    </div>`
  return scene
}

function createHud() {
  const hud = document.createElement('div')
  hud.dataset.skinChrome = 'hud'
  hud.dataset.skinOwner = SKIN_OWNER
  hud.setAttribute('aria-hidden', 'true')
  hud.innerHTML = `
    <span data-hud-corner="tl"></span><span data-hud-corner="tr"></span>
    <span data-hud-corner="bl"></span><span data-hud-corner="br"></span>
    <div data-hud-status><b>OPS // DSH</b><i></i><span>RHODES LINK ESTABLISHED</span></div>
    <div data-hud-index>PRTS / 01 / RHODES</div>`
  return hud
}

function decorateSidebar() {
  const root = document.querySelector(SIDEBAR_SELECTOR)?.querySelector(':scope > div')
  if (!root) return
  if (!root.querySelector("[data-skin-chrome='sidebar-frame']")) {
    const frame = document.createElement('div')
    frame.dataset.skinChrome = 'sidebar-frame'
    frame.dataset.skinOwner = SKIN_OWNER
    frame.setAttribute('aria-hidden', 'true')
    frame.innerHTML = '<i></i><i></i><i></i><i></i>'
    root.prepend(frame)
  }
  if (!root.querySelector("[data-skin-chrome='sidebar-mark']")) {
    const mark = document.createElement('div')
    mark.dataset.skinChrome = 'sidebar-mark'
    mark.dataset.skinOwner = SKIN_OWNER
    mark.setAttribute('aria-hidden', 'true')
    mark.innerHTML = '<strong>R.I.</strong><span>RHODES ISLAND<br>OPERATIONS TERMINAL</span><em>01</em>'
    root.prepend(mark)
  }
}

function decorateWorkspaceTree() {
  const sidebar = document.querySelector(SIDEBAR_SELECTOR)
  if (!sidebar) return
  sidebar.querySelectorAll('[data-ak-workspace-row], [data-ak-session-row], [data-ak-session-first], [data-ak-session-last]').forEach(element => {
    delete element.dataset.akWorkspaceRow
    delete element.dataset.akSessionRow
    delete element.dataset.akSessionFirst
    delete element.dataset.akSessionLast
  })
  sidebar.querySelectorAll("[role='tree']").forEach(tree => {
    const rows = [...tree.querySelectorAll("[role='treeitem']")]
    let sessions = []
    const finish = () => {
      if (sessions[0]) sessions[0].dataset.akSessionFirst = ''
      if (sessions.at(-1)) sessions.at(-1).dataset.akSessionLast = ''
      sessions = []
    }
    rows.forEach(row => {
      if (row.hasAttribute('aria-expanded')) {
        finish()
        row.dataset.akWorkspaceRow = ''
      } else if (row.hasAttribute('aria-selected')) {
        row.dataset.akSessionRow = ''
        sessions.push(row)
      }
    })
    finish()
  })
}

function settingsHost() {
  return [...document.querySelectorAll("[role='dialog'][aria-modal='true']")]
    .find(element => /设置|settings/i.test(element.textContent || ''))
}

function updateSettingsSelection(section) {
  if (!section) return
  const current = preference()
  section.querySelectorAll('button[data-ak-appearance]').forEach(button => {
    const active = button.dataset.akAppearance === current
    button.setAttribute('aria-pressed', String(active))
    if (active) button.dataset.active = ''
    else delete button.dataset.active
  })
}

function ensureSettings(syncMode) {
  const dialog = settingsHost()
  if (!dialog) {
    document.querySelectorAll('[data-ak-settings-open]').forEach(element => {
      delete element.dataset.akSettingsOpen
    })
    return
  }
  const host = dialog.querySelector("[data-slot='settings.section']")
  if (!host || host.querySelector("[data-skin-chrome='settings']")) return
  dialog.dataset.akSettingsDialog = ''
  const overlay = dialog.parentElement?.matches("[role='presentation']")
    ? dialog.parentElement
    : null
  if (overlay) overlay.dataset.akSettingsOverlay = ''
  dialog.closest(SIDEBAR_SELECTOR)?.setAttribute('data-ak-settings-open', '')
  const section = document.createElement('section')
  section.dataset.skinChrome = 'settings'
  section.dataset.skinOwner = SKIN_OWNER
  section.innerHTML = `
    <div><strong>罗德岛终端外观</strong><small>初始页与工作区独立画面 · 即时切换</small></div>
    <div role="group" aria-label="罗德岛终端外观">
      <button type="button" data-ak-appearance="system">跟随系统</button>
      <button type="button" data-ak-appearance="light">白天</button>
      <button type="button" data-ak-appearance="dark">夜晚</button>
    </div>`
  section.addEventListener('click', event => {
    const button = event.target.closest('button[data-ak-appearance]')
    if (!button) return
    try { localStorage.setItem(APPEARANCE_KEY, button.dataset.akAppearance) } catch {}
    updateSettingsSelection(section)
    syncMode()
  })
  host.append(section)
  updateSettingsSelection(section)
}

function phase() {
  return document.querySelector("[data-phase='active']") ? 'active' : 'hero'
}

function syncScene(body, scene) {
  const mode = resolveMode(body)
  const currentPhase = phase()
  const background = currentPhase === 'hero'
    ? (mode === 'dark' ? ARKNIGHTS_HERO_NIGHT : ARKNIGHTS_HERO_DAY)
    : (mode === 'dark' ? ARKNIGHTS_WORKSPACE_DARK : ARKNIGHTS_WORKSPACE_LIGHT)
  body.dataset.arknightsMode = mode
  body.dataset.arknightsPhase = currentPhase
  body.dataset.arknightsBackground = `${currentPhase}-${mode}`
  scene.dataset.mode = mode
  const layer = scene.querySelector("[data-ak-layer='background']")
  layer.style.backgroundImage = `url(${background})`
  layer.dataset.image = `${currentPhase}-${mode}`
  const sidebar = document.querySelector(SIDEBAR_SELECTOR)
  body.style.setProperty('--ak-sidebar-width', `${Math.round(sidebar?.getBoundingClientRect().width || 0)}px`)
}

function createParallaxController(body, scene) {
  const background = scene.querySelector("[data-ak-layer='background']")
  const character = scene.querySelector("[data-ak-layer='character-wrap']")
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const coarse = matchMedia('(pointer: coarse)')
  const narrow = matchMedia('(max-width: 900px)')
  let frame = 0
  let x = 0
  let y = 0
  let focused = document.hasFocus()

  const reset = () => {
    background.style.transform = ''
    character.style.transform = ''
  }
  const disabled = () => reduced.matches || coarse.matches || narrow.matches || !focused || document.hidden
  const sync = () => {
    const dark = body.dataset.arknightsMode === 'dark'
    body.dataset.arknightsMotion = disabled() ? 'reduced' : (dark ? 'single' : 'double')
    if (disabled()) reset()
  }
  const paint = () => {
    frame = 0
    if (disabled()) return reset()
    const dark = body.dataset.arknightsMode === 'dark'
    background.style.transform = dark ? '' : `translate3d(${(-x * 5).toFixed(2)}px, ${(-y * 3).toFixed(2)}px, 0) scale(1.018)`
    const amplitudeX = dark ? 3 : 10
    const amplitudeY = dark ? 2 : 6
    character.style.transform = `translate3d(${(x * amplitudeX).toFixed(2)}px, ${(y * amplitudeY).toFixed(2)}px, 0)`
  }
  const pointer = event => {
    x = event.clientX / innerWidth * 2 - 1
    y = event.clientY / innerHeight * 2 - 1
    if (!frame) frame = requestAnimationFrame(paint)
  }
  const onFocus = () => { focused = true; sync() }
  const onBlur = () => { focused = false; sync() }
  const onVisibility = () => sync()
  window.addEventListener('pointermove', pointer, { passive: true })
  window.addEventListener('focus', onFocus)
  window.addEventListener('blur', onBlur)
  document.addEventListener('visibilitychange', onVisibility)
  for (const media of [reduced, coarse, narrow]) media.addEventListener?.('change', sync)
  sync()
  return {
    sync,
    dispose() {
      cancelAnimationFrame(frame)
      reset()
      window.removeEventListener('pointermove', pointer)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const media of [reduced, coarse, narrow]) media.removeEventListener?.('change', sync)
    },
  }
}

function freezeBackdrop(element) {
  const before = {
    backdrop: element.style.getPropertyValue('backdrop-filter'),
    webkit: element.style.getPropertyValue('-webkit-backdrop-filter'),
    priority: element.style.getPropertyPriority('backdrop-filter'),
    webkitPriority: element.style.getPropertyPriority('-webkit-backdrop-filter'),
  }
  element.dataset.akBackdropFrozen = ''
  element.style.setProperty('backdrop-filter', 'none', 'important')
  element.style.setProperty('-webkit-backdrop-filter', 'none', 'important')
  return () => {
    delete element.dataset.akBackdropFrozen
    before.backdrop ? element.style.setProperty('backdrop-filter', before.backdrop, before.priority) : element.style.removeProperty('backdrop-filter')
    before.webkit ? element.style.setProperty('-webkit-backdrop-filter', before.webkit, before.webkitPriority) : element.style.removeProperty('-webkit-backdrop-filter')
  }
}

function createMotionRuntime(body) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const animations = new Set()
  const rects = new WeakMap()
  const eligible = element => element instanceof HTMLElement && !owned(element) && !element.closest('[data-chat-flow], [data-streaming], [data-dsh-motion="off"]')
  const hostAnimating = element => element.getAnimations?.({ subtree: false }).some(animation => animation.playState === 'running')
  const keyframes = element => {
    if (element.matches("[role='dialog']")) return [{ opacity: 0, transform: 'translateY(6px) scale(.985)' }, { opacity: 1, transform: 'none' }]
    if (element.matches("[role='menu'],[role='listbox']")) return [{ opacity: 0, transform: 'translateY(-4px) scale(.99)' }, { opacity: 1, transform: 'none' }]
    if (element.matches("[role='tabpanel']")) return [{ opacity: .2, transform: 'translateX(5px)' }, { opacity: 1, transform: 'none' }]
    return [{ opacity: .7, transform: 'translateY(-2px)' }, { opacity: 1, transform: 'none' }]
  }
  const animate = (element, duration = 160) => {
    if (reduced.matches || !eligible(element) || hostAnimating(element)) return
    const restore = freezeBackdrop(element)
    const animation = element.animate(keyframes(element), { duration, easing: 'cubic-bezier(.2,.75,.2,1)' })
    animations.add(animation)
    animation.finished.catch(() => {}).finally(() => { restore(); animations.delete(animation) })
  }
  const enter = node => {
    if (!(node instanceof Element)) return
    if (node.matches(MOTION_SELECTOR)) animate(node, node.matches("[role='dialog']") ? 190 : 145)
    node.querySelectorAll?.(MOTION_SELECTOR).forEach(element => animate(element, 145))
    node.querySelectorAll?.("[role='treeitem']").forEach(element => rects.set(element, element.getBoundingClientRect()))
  }
  const ghost = (element, rect) => {
    if (reduced.matches || !eligible(element) || !rect.width || !rect.height) return
    const clone = element.cloneNode(true)
    clone.dataset.dshMotionGhost = ''
    clone.setAttribute('aria-hidden', 'true')
    clone.inert = true
    Object.assign(clone.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', zIndex: '2147483000', pointerEvents: 'none' })
    document.body.append(clone)
    const animation = clone.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-3px) scale(.985)' }], { duration: 135, easing: 'cubic-bezier(.4,0,1,1)' })
    animations.add(animation)
    animation.finished.catch(() => {}).finally(() => { clone.remove(); animations.delete(animation) })
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') {
        record.addedNodes.forEach(enter)
        record.removedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return
          const target = node.matches(MOTION_SELECTOR) ? node : node.querySelector?.(MOTION_SELECTOR)
          if (target) ghost(target, rects.get(target) || target.getBoundingClientRect())
        })
      } else if (record.target instanceof HTMLElement && eligible(record.target)) {
        animate(record.target, 120)
      }
    }
  })
  document.querySelectorAll(MOTION_SELECTOR).forEach(element => rects.set(element, element.getBoundingClientRect()))
  observer.observe(body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected', 'aria-expanded', 'aria-checked', 'data-state'] })
  return () => {
    observer.disconnect()
    animations.forEach(animation => animation.cancel())
    document.querySelectorAll('[data-dsh-motion-ghost]').forEach(element => element.remove())
  }
}

function clearDecorations() {
  document.querySelectorAll('[data-ak-workspace-row], [data-ak-session-row], [data-ak-session-first], [data-ak-session-last]').forEach(element => {
    delete element.dataset.akWorkspaceRow
    delete element.dataset.akSessionRow
    delete element.dataset.akSessionFirst
    delete element.dataset.akSessionLast
  })
}

export function apply(ctx) {
  const body = document.body
  const originalTitle = document.title
  const scene = createScene()
  body.setAttribute(BODY_ATTR, '')
  body.append(scene, createHud())
  document.title = SKIN_TITLE
  ctx.effect(() => installSkinStyles(), 'ui-skin-arknights-terminal: stylesheet')

  let parallax
  const syncMode = () => {
    syncScene(body, scene)
    parallax?.sync()
    updateSettingsSelection(document.querySelector("[data-skin-chrome='settings']"))
  }
  decorateSidebar()
  decorateWorkspaceTree()
  syncMode()
  parallax = createParallaxController(body, scene)
  const disposeMotion = createMotionRuntime(body)

  let resizeObserver
  const observeSidebar = () => {
    if (typeof ResizeObserver === 'undefined') return
    resizeObserver?.disconnect()
    const sidebar = document.querySelector(SIDEBAR_SELECTOR)
    if (!sidebar) return
    resizeObserver = new ResizeObserver(syncMode)
    resizeObserver.observe(sidebar)
  }
  observeSidebar()

  const colorScheme = matchMedia('(prefers-color-scheme: dark)')
  colorScheme.addEventListener?.('change', syncMode)
  let queued = false
  const observer = new MutationObserver(() => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      decorateSidebar()
      decorateWorkspaceTree()
      ensureSettings(syncMode)
      observeSidebar()
      syncMode()
    })
  })
  observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ds-dark-theme', 'data-ds-light-theme', 'data-theme', 'data-phase', 'aria-selected'] })
  ensureSettings(syncMode)

  ctx.effect(() => () => {
    observer.disconnect()
    resizeObserver?.disconnect()
    colorScheme.removeEventListener?.('change', syncMode)
    disposeMotion()
    parallax.dispose()
    body.removeAttribute(BODY_ATTR)
    delete body.dataset.arknightsMode
    delete body.dataset.arknightsMotion
    delete body.dataset.arknightsPhase
    delete body.dataset.arknightsBackground
    body.style.removeProperty('--ak-sidebar-width')
    document.querySelectorAll(`[data-skin-owner='${SKIN_OWNER}']`).forEach(element => element.remove())
    clearDecorations()
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-arknights-terminal: runtime')
}
