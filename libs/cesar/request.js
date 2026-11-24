import { parse } from "node-html-parser"
import {
  authClient,
  cookieJar,
  isLoginPage,
  renewSession,
  useSession,
} from "./session.js"

export const cesarClient = authClient.extend({
  hooks: {
    beforeRequest: [
      async (options) => {
        await useSession()
        options.headers.cookie = await cookieJar.getCookieString(
          options.url.toString(),
        )
      },
    ],
    afterResponse: [
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
