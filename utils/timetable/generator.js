import { Resvg } from "@resvg/resvg-js"
import dayjs from "dayjs"
import { readFileSync } from "fs"
import satori from "satori"
import { createUniqueColorMap } from "../color.js"
import {
  TIMETABLE_AFTERNOON_HOUR,
  TIMETABLE_DAYS,
  TIMETABLE_THEME,
} from "../constants.js"
import { styles } from "./styles.js"

export const generateTimetable = async (lessons, monday) => {
  const getColor = createUniqueColorMap(TIMETABLE_THEME.subjectColors)

  const schedule = Array.from({ length: TIMETABLE_DAYS.length }, (_, i) => {
    const day = monday.add(i, "day")
    const dayLessons = lessons.filter(
      (l) =>
        dayjs(l.startDate).format("YYYY-MM-DD") === day.format("YYYY-MM-DD"),
    )
    return {
      morning: dayLessons.filter(
        (l) => dayjs(l.startDate).hour() < TIMETABLE_AFTERNOON_HOUR,
      ),
      afternoon: dayLessons.filter(
        (l) => dayjs(l.startDate).hour() >= TIMETABLE_AFTERNOON_HOUR,
      ),
    }
  })

  const now = dayjs()
  const tomorrow = now.add(1, "day")
  const currentMonday = now.day(now.day() === 0 ? -6 : 1).startOf("day")
  const isCurrentWeek = monday.isSame(currentMonday, "day")

  const lessonCard = (lesson) => {
    const color = getColor(lesson.schoolSubject.name)
    const start = dayjs(lesson.startDate).format("HH:mm")
    const end = dayjs(lesson.endDate).format("HH:mm")
    const room = lesson.remote
      ? "Distancielle"
      : lesson.rooms.map((r) => r.name).join(", ")
    const teacher = lesson.teachers
      .map((t) => `${t.firstName} ${t.lastName}`)
      .join(", ")

    return {
      type: "div",
      props: {
        style: styles.card(color),
        children: [
          {
            type: "div",
            props: {
              style: styles.cardGroup,
              children: [
                {
                  type: "span",
                  props: {
                    style: styles.subject(color),
                    children: lesson.schoolSubject.name,
                  },
                },
                {
                  type: "span",
                  props: { style: styles.room, children: room || "—" },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: styles.cardGroup,
              children: [
                {
                  type: "span",
                  props: { style: styles.time, children: `${start} – ${end}` },
                },
                {
                  type: "span",
                  props: { style: styles.teacher, children: teacher },
                },
              ],
            },
          },
        ],
      },
    }
  }

  const cell = (slot, isToday) => ({
    type: "div",
    props: {
      style: styles.cell(isToday, slot.length > 0),
      children: slot.length
        ? slot.map(lessonCard)
        : [{ type: "span", props: { style: styles.emptyCell, children: "—" } }],
    },
  })

  const row = (slotKey) => ({
    type: "div",
    props: {
      style: styles.row,
      children: schedule.map((d, i) =>
        cell(d[slotKey], monday.add(i, "day").isSame(tomorrow, "day")),
      ),
    },
  })

  const element = {
    type: "div",
    props: {
      style: styles.root,
      children: [
        {
          type: "div",
          props: {
            style: styles.headerRow,
            children: TIMETABLE_DAYS.map((day, i) => {
              const isToday = monday.add(i, "day").isSame(tomorrow, "day")

              return {
                type: "div",
                props: {
                  style: styles.headerCell(isToday),
                  children: [
                    {
                      type: "span",
                      props: {
                        style: styles.headerText(isToday),
                        children: `${day} ${monday.add(i, "day").format("DD/MM")}`,
                      },
                    },
                  ],
                },
              }
            }),
          },
        },
        row("morning"),
        row("afternoon"),
        {
          type: "div",
          props: {
            style: styles.footer,
            children: [
              {
                type: "span",
                props: {
                  style: styles.footerText,
                  children: `Du ${monday.format("DD/MM/YYYY")} au ${monday.add(4, "day").format("DD/MM/YYYY")}`,
                },
              },
              {
                type: "span",
                props: {
                  style: styles.badge(isCurrentWeek),
                  children: isCurrentWeek
                    ? "Semaine en cours"
                    : "Prochaine semaine de cours",
                },
              },
            ],
          },
        },
      ],
    },
  }

  const fontRegular = readFileSync("./fonts/JetBrainsMono-Regular.ttf")
  const fontBold = readFileSync("./fonts/JetBrainsMono-Bold.ttf")

  const svg = await satori(element, {
    width: 1900,
    height: 760,
    fonts: [
      {
        name: "JetBrains Mono",
        data: fontRegular,
        weight: 400,
        style: "normal",
      },
      { name: "JetBrains Mono", data: fontBold, weight: 700, style: "normal" },
    ],
  })

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1900 } })

  return resvg.render().asPng()
}
