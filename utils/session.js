import { FormData } from "formdata-node"
import fs from "fs"
import got from "got"
import { parse } from "node-html-parser"
import { CookieJar } from "tough-cookie"
import UserAgent from "user-agents"
import config from "../config.js"
import { CVEC_URLS, LOGIN_URLS } from "./constants.js"

const COOKIE_NAME = "PHPSESSID"
const SESSION_FILE = "./sessid.txt"

const userAgent = new UserAgent({ platform: "Win32" })
const cookieJar = new CookieJar()
const client = got.extend({
  prefixUrl: config.baseUrl,
  cookieJar,
  retry: {
    limit: 0,
  },
  headers: {
    "User-Agent": userAgent().toString(),
    Origin: config.baseUrl,
  },
  maxRedirects: 2,
})

const bypassCVEC = async () => {
  const form = new FormData()

  form.set("cvec_file[cvec_file]", {
    filename: "",
    contentType: "application/octet-stream",
  })

  form.set("cvec_file[_token]", "csrf-token")
  form.set("cvec_file[skip]", "skip")

  await client.post(`upload/cvec`, {
    headers: {
      Referrer: `${config.baseUrl}/upload/cvec`,
    },
    body: form,
    followRedirect: false,
  })
}

export const createSession = async () => {
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
    const logged = await client.post("connexion", {
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

    if (CVEC_URLS.includes(logged.url)) {
      await bypassCVEC()
    }

    return sessid
  } catch (error) {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE)
    }

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

  if (LOGIN_URLS.includes(res.url)) {
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
