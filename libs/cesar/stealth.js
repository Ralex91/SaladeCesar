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

export const refreshBrowserHeaders = async () => {
  milestone = await getStableChromeMilestone(milestone)
}

export const browserHeadersHook = (options) => {
  Object.assign(options.headers, chromeHeaders(milestone))
}
