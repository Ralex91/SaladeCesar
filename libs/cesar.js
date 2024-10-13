import got from "got"
import { parse } from "node-html-parser"
import config from "../config.js"
import { useSession } from "../utils/session.js"

const bodyParser = async (path) => {
  const session = await useSession()
  const { body, ok } = await got.get(`${config.baseUrl}${path ?? ""}`, {
    headers: {
      Cookie: `PHPSESSID=${session}`,
    },
  })

  if (!ok) {
    throw Error(`Cesar error: ${res.status} : ${res.statusText}`)
  }

  const root = parse(body)

  return root
}

const calandarJson = async (path) => {
  const body = await bodyParser(path)
  const json = body
    .querySelector("div[data-tui-calendar-event-lesson-schedules-value]")
    .getAttribute("data-tui-calendar-event-lesson-schedules-value")

  return JSON.parse(json)
}

export const getCalandar = async () => await calandarJson("/emploi-du-temps")

export const getLessonsOfDay = async () => {
  const dayCalendar = await calandarJson()

  const newCalendar = dayCalendar.map((lesson) => ({
    ...lesson,
    signed: lesson.attendanceSheet
      ? lesson.attendanceSheet.attendanceSheetLines.some(
          (line) => line.signature !== null
        )
      : null,
  }))

  return newCalendar
}
