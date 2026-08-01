const bitmapCache = new Map<string, ImageBitmap>()
let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./textureWorker.ts', import.meta.url))
    worker.onmessage = ({ data }: MessageEvent<{ id: string; bitmap?: ImageBitmap; error?: string }>) => {
      if (data.bitmap) bitmapCache.set(data.id, data.bitmap)
    }
  }
  return worker
}

function send(id: string, fn: string, args: unknown[]): void {
  getWorker().postMessage({ id, fn, args })
}

export function getBitmap(key: string): ImageBitmap | undefined {
  return bitmapCache.get(key)
}

export function preloadTextures(): void {
  send('cardColor',    'cardboardCanvas',      [42, false])
  send('cardBump',     'cardboardCanvas',      [29, true])
  send('kraftColor',   'kraftCanvas',          [168, 126, 79, 55, false])
  send('kraftBump',    'kraftCanvas',          [160, 160, 160, 111, true])
  send('metalColor',   'metallicCanvas',       [200, false])
  send('metalBump',    'metallicCanvas',       [210, true])
  send('alColor',      'aluminumCanvas',       [300, false])
  send('alBump',       'aluminumCanvas',       [310, true])
  send('marbleColor',  'marbleCanvas',         [400, false])
  send('marbleBump',   'marbleCanvas',         [410, true])
  send('leatherColor', 'leatherCanvas',        [500, false])
  send('leatherBump',  'leatherCanvas',        [510, true])
  send('holoBump',     'holographicBumpCanvas', [])
}
