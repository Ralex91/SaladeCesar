import got from "got"
import { decode } from "html-entities"
import { parse } from "node-html-parser"
import config from "../config.js"
import {
  SELECTOR_COURSE_GRADES,
  SELECTOR_COURSE_NAME,
  SELECTOR_COURSES,
  SELECTOR_GRADE,
  SELECTOR_GRADE_COMMENT,
  SELECTOR_GRADE_ROW,
  SELECTOR_GRADE_ROW_COEF,
  SELECTOR_GRADE_ROW_DATE,
  SELECTOR_GRADE_ROW_GROUP_AVG,
  SELECTOR_GRADE_TITLE,
} from "../utils/constants.js"
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

const extractText = (element) => {
  if (!element || !element.innerText) {
    return null
  }

  return decode(element.innerText.trim())
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

export const getGrades = async () => {
  const body = await bodyParser("/mes-notes")
  const cours = body.querySelectorAll(SELECTOR_COURSES)

  const gradesList = cours.map((cour) => ({
    name: extractText(cour.querySelector(SELECTOR_COURSE_NAME)),
    grades: cour.querySelectorAll(SELECTOR_COURSE_GRADES).map((grade) => ({
      title: extractText(cour.querySelector(SELECTOR_GRADE_TITLE)),
      grade: extractText(grade.querySelector(SELECTOR_GRADE)).replace(
        /\s+/g,
        "/"
      ),
      comment: extractText(grade.querySelector(SELECTOR_GRADE_COMMENT)),
      date: extractText(
        grade.querySelectorAll(SELECTOR_GRADE_ROW)[SELECTOR_GRADE_ROW_DATE]
      ),
      coeficient: parseInt(
        extractText(
          grade.querySelectorAll(SELECTOR_GRADE_ROW)[SELECTOR_GRADE_ROW_COEF]
        )
      ),
      groupAverage: extractText(
        grade.querySelectorAll(SELECTOR_GRADE_ROW)[SELECTOR_GRADE_ROW_GROUP_AVG]
      ),
    })),
  }))

  return gradesList
}

export const findNewGrades = (oldGrades, newGrades) =>
  newGrades
    .map((newSubject) => {
      const oldSubject = oldGrades.find(
        (subject) => subject.name === newSubject.name
      )

      if (oldSubject) {
        const oldGradesList = oldSubject.grades || []
        const newGradesList = newSubject.grades || []

        const newEntries = newGradesList.filter(
          (newGrade) =>
            !oldGradesList.some(
              (oldGrade) =>
                oldGrade.title === newGrade.title &&
                oldGrade.grade === newGrade.grade &&
                oldGrade.date === newGrade.date
            )
        )

        if (newEntries.length > 0) {
          return {
            lessonName: newSubject.name,
            newGrades: newEntries,
          }
        }
      }

      return null
    })
    .filter((diff) => diff !== null)
