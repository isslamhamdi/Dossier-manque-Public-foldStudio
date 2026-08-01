// varnishDetector.worker.ts — Off-thread UV varnish mask generation.
//
// Analyzes artwork ImageData and produces a greyscale mask where bright or
// highly-saturated pixels (typical of metallic inks, spot colors, and photo
// highlights) score high for selective UV varnish application.
//
// Algorithm per pixel:
//   brightness  = max(R, G, B)                      — photographic luminance proxy
//   saturation  = (max − min) / max                 — HSV saturation
//   varnishScore = clamp(brightness × 1.3 + saturation × 0.35)
//   output = score > threshold ? score : 0
//
// Usage (from main thread):
//   const worker = new Worker(new URL('./varnishDetector.worker', import.meta.url))
//   worker.postMessage({ imageData, threshold: 0.55 })
//   worker.onmessage = (e) => { const { mask } = e.data }

export interface VarnishDetectorInput {
  imageData: ImageData
  threshold?: number   // 0–1, default 0.55
}

export interface VarnishDetectorOutput {
  mask: ImageData      // RGBA, R=G=B=varnish strength, A=255
}

self.onmessage = function (e: MessageEvent<VarnishDetectorInput>) {
  const { imageData, threshold = 0.55 } = e.data
  const { data, width, height } = imageData
  const maskData = new Uint8ClampedArray(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]     / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max > 0 ? (max - min) / max : 0

    // High brightness AND high saturation both trigger varnish
    const score = Math.min(1, max * 1.3 + saturation * 0.35)
    const varnishValue = score > threshold ? score : 0

    // Optional: blur could be applied here for smoother mask edges
    // For now: hard cutoff with strength carry-through
    const byte = Math.round(varnishValue * 255)
    maskData[i]     = byte
    maskData[i + 1] = byte
    maskData[i + 2] = byte
    maskData[i + 3] = 255
  }

  const mask = new ImageData(maskData, width, height)
  // Transfer ownership of the underlying buffer to avoid a copy
  ;(self as unknown as DedicatedWorkerGlobalScope).postMessage(
    { mask } satisfies VarnishDetectorOutput,
    [maskData.buffer],
  )
}
