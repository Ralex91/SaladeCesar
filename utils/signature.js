import { Resvg } from "@resvg/resvg-js"

const WIDTH = 300
const HEIGHT = 150
const MARGIN = 10
const DEFAULT_POINT_INTERVAL = 16
const FILL = { min: 0.6, max: 0.8 }
const CENTER_JITTER = 0.08

const rand = (min, max) => min + Math.random() * (max - min)

const pick = (list) => list[Math.floor(Math.random() * list.length)]

const smoothWave = () => {
  const waves = Array.from({ length: 2 }, () => ({
    amp: rand(0.5, 2.5),
    freq: rand(0.01, 0.04),
    phase: rand(0, Math.PI * 2),
  }))

  return (v) =>
    waves.reduce(
      (sum, w) => sum + w.amp * Math.sin(v * w.freq + w.phase),
      0,
    )
}

const boundingBox = (strokes) => {
  const points = strokes.flat()
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

const transformStrokes = (strokes) => {
  const box = boundingBox(strokes)
  const cx = (box.minX + box.maxX) / 2
  const cy = (box.minY + box.maxY) / 2

  const angle = (rand(-6, 6) * Math.PI) / 180
  const scale = rand(0.85, 1.1)
  const stretch = rand(0.9, 1.1)
  const slant = rand(-0.15, 0.15)
  const waveX = smoothWave()
  const waveY = smoothWave()

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const transformed = strokes.map((stroke) =>
    stroke.map(([x, y, time], i) => {
      let px = (x - cx) * scale * stretch + waveX(y)
      let py = (y - cy) * scale + waveY(x)

      px += py * slant

      return [
        px * cos - py * sin,
        px * sin + py * cos,
        time ?? i * DEFAULT_POINT_INTERVAL,
      ]
    }),
  )

  const fitted = boundingBox(transformed)
  const width = fitted.maxX - fitted.minX
  const height = fitted.maxY - fitted.minY
  const fit = Math.min(
    (WIDTH * rand(FILL.min, FILL.max)) / width,
    (HEIGHT * rand(FILL.min, FILL.max)) / height,
  )

  const slackX = (WIDTH - MARGIN * 2 - width * fit) / 2
  const slackY = (HEIGHT - MARGIN * 2 - height * fit) / 2
  const offsetX =
    MARGIN + slackX + rand(-1, 1) * Math.min(slackX, WIDTH * CENTER_JITTER)
  const offsetY =
    MARGIN + slackY + rand(-1, 1) * Math.min(slackY, HEIGHT * CENTER_JITTER)

  return transformed.map((stroke) =>
    stroke.map(([x, y, time]) => [
      (x - fitted.minX) * fit + offsetX,
      (y - fitted.minY) * fit + offsetY,
      time * fit,
    ]),
  )
}

// Stroke rendering adapted from signature_pad (https://github.com/szimek/signature_pad)

const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

const velocity = (from, to) =>
  to.time !== from.time ? distance(from, to) / (to.time - from.time) : 0

const controlPoints = (s1, s2, s3) => {
  const m1 = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 }
  const m2 = { x: (s2.x + s3.x) / 2, y: (s2.y + s3.y) / 2 }
  const l1 = distance(s1, s2)
  const l2 = distance(s2, s3)
  const k = l1 + l2 === 0 ? 0 : l2 / (l1 + l2)
  const cm = { x: m2.x + (m1.x - m2.x) * k, y: m2.y + (m1.y - m2.y) * k }
  const tx = s2.x - cm.x
  const ty = s2.y - cm.y

  return {
    c1: { x: m1.x + tx, y: m1.y + ty },
    c2: { x: m2.x + tx, y: m2.y + ty },
  }
}

const bezierPoint = (t, p0, p1, p2, p3) => {
  const u = 1 - t

  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  }
}

const bezierLength = (p0, p1, p2, p3) => {
  let length = 0
  let previous = p0

  for (let i = 1; i <= 10; i++) {
    const point = bezierPoint(i / 10, p0, p1, p2, p3)
    length += distance(previous, point)
    previous = point
  }

  return length
}

const curveDots = (p0, p1, p2, p3, startWidth, endWidth, maxWidth) => {
  const steps = Math.max(1, Math.ceil(bezierLength(p0, p1, p2, p3) * 2))

  return Array.from({ length: steps }, (_, i) => {
    const t = i / steps
    const { x, y } = bezierPoint(t, p0, p1, p2, p3)

    return {
      x,
      y,
      r: Math.min(startWidth + t * t * t * (endWidth - startWidth), maxWidth),
    }
  })
}

export const strokeDots = (
  stroke,
  {
    minWidth = 0.5,
    maxWidth = 2.5,
    velocityFilterWeight = 0.7,
    velocityScale = 3,
    timeScale = 1,
  },
) => {
  const points = stroke.map(([x, y, time], i) => ({
    x,
    y,
    time: (time ?? i * DEFAULT_POINT_INTERVAL) * timeScale,
  }))

  if (points.length === 1) {
    return [{ ...points[0], r: (minWidth + maxWidth) / 2 }]
  }

  const dots = []
  const buffer = []
  let lastVelocity = 0
  let lastWidth = (minWidth + maxWidth) / 2

  for (const point of [...points, points[points.length - 1]]) {
    buffer.push(point)

    if (buffer.length < 3) {
      continue
    }

    if (buffer.length === 3) {
      buffer.unshift(buffer[0])
    }

    const [s1, s2, s3, s4] = buffer
    const v =
      velocityFilterWeight * velocity(s2, s3) * velocityScale +
      (1 - velocityFilterWeight) * lastVelocity
    const width = Math.max(maxWidth / (v + 1), minWidth)

    dots.push(
      ...curveDots(
        s2,
        controlPoints(s1, s2, s3).c2,
        controlPoints(s2, s3, s4).c1,
        s3,
        lastWidth,
        width,
        maxWidth,
      ),
    )

    lastVelocity = v
    lastWidth = width
    buffer.shift()
  }

  return dots
}

export const signatureSvg = (samples, { background = "none" } = {}) => {
  const strokes = transformStrokes(pick(samples))
  const options = {
    minWidth: rand(0.4, 0.7),
    maxWidth: rand(2, 2.6),
    velocityFilterWeight: rand(0.6, 0.8),
    timeScale: rand(0.8, 1.25),
  }

  const dots = strokes
    .flatMap((stroke) => strokeDots(stroke, options))
    .map(
      ({ x, y, r }) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" />`,
    )
    .join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="100%" height="100%" fill="${background}" /><g fill="#000">${dots}</g></svg>`
}

export const generateSignature = (samples, options) =>
  new Resvg(signatureSvg(samples, options)).render().asPng()

export const generateSignatureDataUrl = (samples, options) =>
  `data:image/png;base64,${generateSignature(samples, options).toString("base64")}`
