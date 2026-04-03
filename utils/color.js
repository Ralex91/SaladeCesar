export const getHexRandomColor = () => {
  const letters = "0123456789ABCDEF"
  let color = "#"

  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }

  return color
}

export const createUniqueColorMap = (palette) => {
  const assigned = new Map()
  const taken = new Set()

  const hashName = (name) => {
    let hash = 0
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    return hash
  }

  const pickIndex = (startIdx) => {
    let idx = startIdx % palette.length
    while (taken.has(idx)) idx = (idx + 1) % palette.length
    return idx
  }

  return (name) => {
    if (assigned.has(name)) return assigned.get(name)

    const idx = pickIndex(hashName(name))
    const color = palette[idx]

    taken.add(idx)
    assigned.set(name, color)

    return color
  }
}
