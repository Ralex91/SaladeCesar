import dayjs from "dayjs"
import { fetchPage } from "../client.js"
import { CALENDAR } from "../constants.js"

export const readCalendarAttr = (root, name) =>
  root
    .querySelector(CALENDAR.selector)
    ?.getAttribute(`${CALENDAR.attrPrefix}${name}-value`)

const calandarJson = async (path) => {
  const root = await fetchPage(path)

  return JSON.parse(readCalendarAttr(root, CALENDAR.attrs.schedules))
}

export const getCalandar = async () => await calandarJson("emploi-du-temps")

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
