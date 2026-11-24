import got from "got"
import { parse } from "node-html-parser"
import {
  clientOptions,
  cookieJar,
  isLoginPage,
  renewSession,
  useSession,
} from "./session.js"
import {
  browserHeadersHook,
  orderHeadersHook,
  trackPageHook,
} from "./stealth.js"

export const cesarClient = got.extend(clientOptions, {
  hooks: {
    beforeRequest: [
      async (options) => {
        await useSession()
        options.headers.cookie = await cookieJar.getCookieString(
          options.url.toString(),
        )
      },
      browserHeadersHook,
      orderHeadersHook,
    ],
    afterResponse: [
      trackPageHook,
      async (response, retryWithMergedOptions) => {
        if (!isLoginPage(response.url)) {
          return response
        }

        await renewSession()

        return retryWithMergedOptions({
          prefixUrl: "",
          url: response.requestUrl,
        })
      },
    ],
  },
})

export const fetchPage = async (path = "") => {
  const { body } = await cesarClient.get(path)

  return parse(body)
}
