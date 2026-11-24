import { FormData } from "formdata-node"
import fs from "fs"
import got from "got"
import { parse } from "node-html-parser"
import { CookieJar } from "tough-cookie"
import config from "../../config.js"
import { CVEC_URLS, LOGIN_URLS, SESSION } from "./constants.js"
import { browserHeadersHook, refreshBrowserHeaders } from "./stealth.js"

export const cookieJar = new CookieJar()
export const authClient = got.extend({
  prefixUrl: config.baseUrl,
  cookieJar,
  retry: {
    limit: 0,
  },
  headers: {
    Origin: config.baseUrl,
  },
  hooks: {
    beforeRequest: [browserHeadersHook],
  },
  maxRedirects: 2,
  https: {
    rejectUnauthorized: false,
  },
})

export const isLoginPage = (url) => LOGIN_URLS.includes(url.split("?")[0])

const readSavedSessid = () =>
  fs.existsSync(SESSION.file)
    ? fs.readFileSync(SESSION.file, "utf8").trim() || null
    : null

const saveSessid = (sessid) => fs.writeFileSync(SESSION.file, sessid, "utf8")

const deleteSavedSession = () => {
  if (fs.existsSync(SESSION.file)) {
    fs.unlinkSync(SESSION.file)
  }
}

const bypassCVEC = async (pageUrl) => {
  const form = new FormData()

  form.set("cvec_file[cvec_file]", {
    filename: "",
    contentType: "application/octet-stream",
  })

  form.set("cvec_file[_token]", "csrf-token")
  form.set("cvec_file[skip]", "skip")

  await authClient.post(`upload/cvec`, {
    headers: {
      Referer: pageUrl,
    },
    body: form,
    followRedirect: false,
  })
}

export const createSession = async () => {
  await refreshBrowserHeaders()

  const { body: bodyCsrf } = await authClient.get("connexion")

  const csrf = parse(bodyCsrf)
    .querySelector("input[name='_csrf_token']")
    .getAttribute("value")

  const creds = new URLSearchParams()
  creds.set("_username", process.env.CESAR_USERNAME)
  creds.set("_password", process.env.CESAR_PASSWORD)
  creds.set("_csrf_token", csrf)
  creds.set("_referer", "")

  try {
    const logged = await authClient.post("connexion", {
      body: creds.toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: `${config.baseUrl}/connexion`,
      },
    })

    const { value: sessid } = cookieJar
      .getCookiesSync(config.baseUrl)
      .find((cookie) => cookie.key === SESSION.cookieName)

    saveSessid(sessid)

    if (CVEC_URLS.includes(logged.url)) {
      await bypassCVEC(logged.url)
    }

    return sessid
  } catch (error) {
    deleteSavedSession()

    if (error.name === "MaxRedirectsError") {
      throw Error("Cesar: Invalid credentials")
    }

    throw Error(`Cesar error: failed to login, ${error.message}`)
  }
}

export const checkSession = async (sessid) => {
  cookieJar.setCookieSync(`${SESSION.cookieName}=${sessid}`, config.baseUrl, {
    httpOnly: true,
  })

  const res = await authClient.get()

  return !isLoginPage(res.url)
}

const loadSession = async () => {
  const sessid = readSavedSessid()

  if (sessid && (await checkSession(sessid))) {
    return sessid
  }

  return createSession()
}

let sessionPromise = null
let renewPromise = null

const trackSession = (promise) => {
  sessionPromise = promise.catch((error) => {
    sessionPromise = null
    throw error
  })

  return sessionPromise
}

export const useSession = () => sessionPromise ?? trackSession(loadSession())

export const renewSession = () =>
  (renewPromise ??= trackSession(createSession()).finally(() => {
    renewPromise = null
  }))
