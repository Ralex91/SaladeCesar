import got from "got"
import { CHROME } from "./constants.js"

const chromeUserAgent = (milestone) =>
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${milestone}.0.0.0 Safari/537.36`

const chromeSecChUa = (milestone) => {
  const { chars, versions, orders } = CHROME.grease
  const seed = Number(milestone)
  const greased = {
    brand: `Not${chars[seed % chars.length]}A${chars[(seed + 1) % chars.length]}Brand`,
    version: versions[seed % versions.length],
  }
  const brands = [
    greased,
    { brand: "Chromium", version: String(milestone) },
    { brand: "Google Chrome", version: String(milestone) },
  ]

  const ordered = []
  orders[seed % orders.length].forEach((position, i) => {
    ordered[position] = brands[i]
  })

  return ordered
    .map(({ brand, version }) => `"${brand}";v="${version}"`)
    .join(", ")
}

const chromeHeaders = (milestone) => ({
  "user-agent": chromeUserAgent(milestone),
  "sec-ch-ua": chromeSecChUa(milestone),
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
})

const getStableChromeMilestone = async (fallback) => {
  try {
    const response = await got.get(CHROME.channelsUrl, {
      retry: { limit: 2 },
    })
    const { version } = JSON.parse(response.body).channels.Stable

    return version.split(".")[0]
  } catch (error) {
    console.warn(
      `Failed to fetch stable Chrome version, using ${fallback}: ${error.message}`,
    )

    return fallback
  }
}

let milestone = await getStableChromeMilestone(CHROME.fallbackMilestone)
let lastPageUrl = null

export const refreshBrowserHeaders = async () => {
  milestone = await getStableChromeMilestone(milestone)
}

const requestMode = (options) => options.context?.mode ?? "navigate"

export const browserHeadersHook = (options) => {
  const { headers } = options
  const mode = requestMode(options)
  const method = options.method.toUpperCase()

  if (mode === "navigate" && !headers.referer && lastPageUrl) {
    headers.referer = lastPageUrl
  }

  Object.assign(
    headers,
    chromeHeaders(milestone),
    CHROME.headers.common,
    CHROME.headers[mode],
  )

  headers["sec-fetch-site"] = headers.referer ? "same-origin" : "none"

  if (method === "GET" || method === "HEAD") {
    delete headers.origin
  } else {
    headers.origin = new URL(options.url).origin
  }

  if (mode === "navigate" && method === "POST") {
    headers["cache-control"] = "max-age=0"
  } else {
    delete headers["cache-control"]
  }
}

export const orderHeadersHook = (options) => {
  const { headers } = options
  const order = CHROME.headerOrder[requestMode(options)]
  const rank = (name) => {
    const index = order.indexOf(name)

    return index === -1 ? order.length : index
  }

  const ordered = Object.entries(headers).sort(([a], [b]) => rank(a) - rank(b))

  for (const [name] of ordered) {
    delete headers[name]
  }

  for (const [name, value] of ordered) {
    headers[name] = value
  }
}

export const trackPageHook = (response) => {
  if (requestMode(response.request.options) === "navigate") {
    lastPageUrl = response.url
  }

  return response
}
