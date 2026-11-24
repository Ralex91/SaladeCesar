import { decode } from "html-entities"
import { fetchPage } from "../client.js"
import { GRADES } from "../constants.js"

const extractText = (element) => {
  if (!element || !element.innerText) {
    return null
  }

  return decode(element.innerText.trim())
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
  const body = await fetchPage("mes-notes")

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
