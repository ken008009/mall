const PLAOC_EXTERNAL_URL_KEY = 'X-Plaoc-External-Url'

const hasPlaocUrlParam = () => {
  const params = new URLSearchParams(location.search)
  if (params.get(PLAOC_EXTERNAL_URL_KEY)) return true

  const hashQuery = location.hash.includes('?')
    ? location.hash.slice(location.hash.indexOf('?') + 1)
    : ''
  if (hashQuery && new URLSearchParams(hashQuery).get(PLAOC_EXTERNAL_URL_KEY)) {
    return true
  }
  return false
}

/** 是否在 DWeb / BIW Meta 容器内运行 */
export const isDwebEnv = () => {
  if (location.hostname.endsWith('.dweb')) return true
  if (hasPlaocUrlParam()) return true
  return false
}

/** 按需加载 plaoc，避免普通浏览器连接 external WebSocket */
export const loadPlaoc = async () => {
  if (!isDwebEnv()) {
    throw new Error('Not in DWeb environment')
  }
  return import('@plaoc/plugins')
}

export const restartDwebApp = async () => {
  const { dwebServiceWorker } = await loadPlaoc()
  dwebServiceWorker.restart()
}
