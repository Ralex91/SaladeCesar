import dayjs from "dayjs"
import fs from "fs"
import got from "got"
import { decode } from "html-entities"
import { parse } from "node-html-parser"
import config from "../config.js"
import { CALENDAR, GRADES, SIGNATURE } from "../utils/constants.js"
import { useSession } from "../utils/session.js"

const requestOptions = async (headers = {}) => ({
  headers: {
    Cookie: `PHPSESSID=${await useSession()}`,
    ...headers,
  },
  https: {
    rejectUnauthorized: false,
  },
})

const bodyParser = async (path) => {
  const res = await got.get(
    `${config.baseUrl}${path ?? ""}`,
    await requestOptions(),
  )

  if (!res.ok) {
    throw Error(`Cesar error: ${res.statusCode} : ${res.statusMessage}`)
  }

  return parse(res.body)
}

const extractText = (element) => {
  if (!element || !element.innerText) {
    return null
  }

  return decode(element.innerText.trim())
}

const readCalendarAttr = (root, name) =>
  root
    .querySelector(CALENDAR.selector)
    ?.getAttribute(`${CALENDAR.attrPrefix}${name}-value`)

const calandarJson = async (path) => {
  const root = await bodyParser(path)

  return JSON.parse(readCalendarAttr(root, CALENDAR.attrs.schedules))
}

export const getCalandar = async () => await calandarJson("/emploi-du-temps")

export const getLessonsOfDay = async () => {
  const dayCalendar = await calandarJson()

  return dayCalendar.map((lesson) => ({
    ...lesson,
    signed: lesson.attendanceSheet
      ? lesson.attendanceSheet.attendanceSheetLines.some(
          (line) => line.signature !== null,
        )
      : null,
  }))
}

export const getNextWeekWithLessons = async () => {
  const calandar = await getCalandar()

  const getLessonsForWeek = (weekStart) => {
    const monday = weekStart.startOf("day")
    const friday = monday.add(4, "day").endOf("day")

    return calandar.filter((lesson) => {
      const date = dayjs(lesson.startDate)

      return (
        (date.isAfter(monday) || date.isSame(monday)) &&
        (date.isBefore(friday) || date.isSame(friday))
      )
    })
  }

  const now = dayjs()
  const tomorrow = now.add(1, "day")
  const limit = tomorrow.add(45, "day")
  let monday = tomorrow.day(tomorrow.day() === 0 ? -6 : 1)

  if (tomorrow.day() === 6 || tomorrow.day() === 0) {
    monday = monday.add(1, "week")
  }

  while (monday.isBefore(limit)) {
    const lessons = getLessonsForWeek(monday)

    if (lessons.length > 0) {
      return { lessons, monday }
    }

    monday = monday.add(1, "week")
  }

  return null
}

const parseGrade = (grade) => {
  const rows = grade.querySelectorAll(GRADES.selectors.row)

  return {
    title: extractText(grade.querySelector(GRADES.selectors.title)),
    grade: extractText(grade.querySelector(GRADES.selectors.grade)).replace(
      /\s+/g,
      "/",
    ),
    comment: extractText(grade.querySelector(GRADES.selectors.comment)),
    date: extractText(rows[GRADES.rowIndex.date]),
    coeficient: parseInt(extractText(rows[GRADES.rowIndex.coef])),
    groupAverage: extractText(rows[GRADES.rowIndex.groupAverage]),
  }
}

export const getGrades = async () => {
  const body = await bodyParser("/mes-notes")

  return body
    .querySelectorAll(GRADES.selectors.courses)
    .filter((cour) => !cour.querySelector(GRADES.selectors.locked))
    .map((cour) => ({
      name: extractText(cour.querySelector(GRADES.selectors.courseName)),
      grades: cour
        .querySelectorAll(GRADES.selectors.courseGrades)
        .map(parseGrade),
    }))
}

const isSameGrade = (a, b) =>
  a.title === b.title && a.grade === b.grade && a.date === b.date

export const findNewGrades = (oldGrades, newGrades) =>
  newGrades
    .map((newSubject) => {
      const oldSubject = oldGrades.find(
        (subject) => subject.name === newSubject.name,
      )

      if (!oldSubject) {
        return null
      }

      const oldGradesList = oldSubject.grades || []
      const newEntries = (newSubject.grades || []).filter(
        (newGrade) =>
          !oldGradesList.some((oldGrade) => isSameGrade(oldGrade, newGrade)),
      )

      if (newEntries.length === 0) {
        return null
      }

      return {
        lessonName: newSubject.name,
        newGrades: newEntries,
      }
    })
    .filter((diff) => diff !== null)

const readSignatureProps = (root) => {
  const raw = root
    .querySelector(SIGNATURE.selector)
    ?.getAttribute(SIGNATURE.propsAttr)

  return raw ? JSON.parse(raw) : null
}

const isSignatureSaved = (props) => typeof props?.signature === "string"

const readSignatureImage = () => {
  if (!fs.existsSync(SIGNATURE.file)) {
    throw Error(`Signature file ${SIGNATURE.file} not found (300x150 PNG)`)
  }

  const base64 = fs.readFileSync(SIGNATURE.file).toString("base64")

  return `data:image/png;base64,${base64}`
}

const postSignatureComponent = async (action, data) => {
  const form = new FormData()
  form.set("data", JSON.stringify(data))

  const url = action
    ? `${SIGNATURE.componentUrl}/${action}`
    : SIGNATURE.componentUrl

  const { body } = await got.post(url, {
    ...(await requestOptions({
      Accept: "application/vnd.live-component+html",
      "X-Requested-With": "XMLHttpRequest",
      "X-Live-Url": "/",
    })),
    body: form,
    retry: { limit: 0 },
  })

  return readSignatureProps(parse(body))
}

const toSignatureLine = (lesson, { studentId, maxMs, serverNow }) => {
  const line = lesson.attendanceSheet?.attendanceSheetLines?.find(
    (l) => l.planningGroupSubscription?.studentRegistration?.uuid === studentId,
  )

  if (!line) {
    return []
  }

  const secondsLeft = Math.round((line.createdAt + maxMs - serverNow) / 1000)
  const signed =
    line.signature?.signed === true || line.attendanceWithoutSignature === true

  return {
    lessonId: lesson.uuid ?? lesson.id,
    subject: lesson.schoolSubject?.name,
    secondsLeft,
    signed,
    open: line.signingOff === true && secondsLeft > 0 && !signed,
  }
}

export const getSignatureLines = async () => {
  const fetchedAt = Date.now()
  const root = await bodyParser()
  const attr = (name) => readCalendarAttr(root, name)

  const schedules = attr(CALENDAR.attrs.schedules)

  if (!schedules) {
    throw Error(
      "Cesar: calendar not found (invalid session or expired password?)",
    )
  }

  const context = {
    studentId: JSON.parse(attr(CALENDAR.attrs.student))?.uuid,
    maxMs: Number(attr(CALENDAR.attrs.maxAttendance)) * 60_000,
    serverNow:
      Number(attr(CALENDAR.attrs.serverTime)) * 1000 + (Date.now() - fetchedAt),
  }

  return JSON.parse(schedules).flatMap((lesson) =>
    toSignatureLine(lesson, context),
  )
}

export const signAttendance = async () => {
  const lines = await getSignatureLines()
  const lesson = lines.find((line) => line.open)

  if (!lesson) {
    throw Error("Cesar: no open signature window")
  }

  const props = readSignatureProps(
    await bodyParser(`/mes-cours/${lesson.lessonId}/emargement`),
  )

  if (!props) {
    throw Error("Cesar: signature component not found")
  }

  if (isSignatureSaved(props)) {
    throw Error("Cesar: attendance already signed")
  }

  const updated = await postSignatureComponent(null, {
    props,
    updated: { "signature.data": readSignatureImage() },
  })

  const signed = await postSignatureComponent("signed", {
    props: updated,
    updated: {},
    args: {},
  })

  if (!isSignatureSaved(signed)) {
    throw Error("Cesar: signature was not saved")
  }
}
