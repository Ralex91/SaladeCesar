import fs from "fs"
import ky from "ky"
import puppeteer from "puppeteer"
import config from "../config.js"

const COOKIE_NAME = "PHPSESSID"
const SESSION_FILE = "sessid.txt"

export const createSession = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  })

  const [page] = await browser.pages()
  page.setDefaultNavigationTimeout(0)

  await page.setRequestInterception(true)

  page.on("request", (req) => {
    if (!["document", "xhr", "fetch", "script"].includes(req.resourceType())) {
      return req.abort()
    }
    req.continue()
  })

  await page.goto(`${config.baseUrl}/connexion`, {
    waitUntil: "networkidle0",
  })

  await page.locator("#username").fill(process.env.CESAR_USERNAME)
  await page.locator("#password").fill(process.env.CESAR_PASSWORD)

  await page.locator("button").click()

  await page.waitForNavigation()

  const sessid = await page.cookies().then((cookies) => {
    return cookies.find((cookie) => cookie.name === COOKIE_NAME).value
  })

  await browser.close()

  fs.writeFileSync(SESSION_FILE, sessid, "utf8")

  return sessid
}

export const checkSession = async (sessid) => {
  const res = await ky.get(config.baseUrl, {
    headers: {
      Cookie: `${COOKIE_NAME}=${sessid}`,
    },
  })

  if (
    res.url === `${config.baseUrl}/connexion` ||
    res.url === `${config.baseUrl}/login`
  ) {
    return false
  }

  return sessid
}

export const useSession = async () => {
  const savedSessid = fs.readFileSync(SESSION_FILE, "utf8")
  const isLogged = await checkSession(savedSessid)
  const session = isLogged ? savedSessid : await createSession()

  if (!isLogged) {
    throw new Error("Cesar: Invalid credentials")
  }

  return session
}
