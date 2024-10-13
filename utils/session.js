import fs from "fs"
import got from "got"
import { parse } from "node-html-parser"
import { CookieJar } from "tough-cookie"
import config from "../config.js"

const COOKIE_NAME = "PHPSESSID"
const SESSION_FILE = "./sessid.txt"

const cookieJar = new CookieJar()
const client = got.extend({
  prefixUrl: config.baseUrl,
  cookieJar,
  retry: {
    limit: 0,
  },
  maxRedirects: 1,
})

const createSession = async () => {
  const { body: bodyCsrf } = await client.get("connexion")

  const csrf = parse(bodyCsrf)
    .querySelector("input[name='_csrf_token']")
    .getAttribute("value")

  const creds = new URLSearchParams()
  creds.set("_username", process.env.CESAR_USERNAME)
  creds.set("_password", process.env.CESAR_PASSWORD)
  creds.set("_csrf_token", csrf)
  creds.set("_referer", "")

  try {
    await client.post("connexion", {
      body: creds.toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        referrer: `${config.baseUrl}/connexion`,
      },
    })

    const { value: sessid } = cookieJar
      .getCookiesSync(config.baseUrl)
      .find((cookie) => cookie.key === COOKIE_NAME)

    fs.writeFileSync(SESSION_FILE, sessid, "utf8")

    return sessid
  } catch (error) {
    if (error.name === "MaxRedirectsError") {
      throw Error("Cesar: Invalid credentials")
    }

    throw Error(`Cesar error: failed to login, ${error.message}`)
  }
}

export const checkSession = async (sessid) => {
  cookieJar.setCookieSync(`${COOKIE_NAME}=${sessid}`, config.baseUrl, {
    httpOnly: true,
  })

  const res = await client.get()

  if (!res.ok) {
    throw Error(`Cesar error: ${res.status} : ${res.statusText}`)
  }

  if (
    res.url === `${config.baseUrl}/connexion` ||
    res.url === `${config.baseUrl}/login`
  ) {
    return false
  }

  return sessid
}

export const useSession = async () => {
  let savedSessid = null

  if (fs.existsSync(SESSION_FILE)) {
    savedSessid = fs.readFileSync(SESSION_FILE, "utf8")
  }

  const isLogged = await checkSession(savedSessid)
  const session = isLogged ? savedSessid : await createSession()

  return session
}
