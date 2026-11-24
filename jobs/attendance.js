import { EmbedBuilder } from "discord.js"
import config from "../config.js"
import { getLessonsOfDay } from "../libs/cesar/requests/calendar.js"
import { formatDate } from "../utils/date.js"
import { scheduleRandomInterval, scheduleWithJitter } from "../utils/schedule.js"

const START_JITTER = 5 * 60_000
const POLL_INTERVAL = { min: 50_000, max: 75_000 }
const POLL_DURATION = 60 * 60_000

const attendanceCheck = async (client) => {
  const checker = () => {
    const endsAt = Date.now() + POLL_DURATION
    const job = scheduleRandomInterval(
      POLL_INTERVAL.min,
      POLL_INTERVAL.max,
      () => task({ stop, endsAt }),
      { immediate: true },
    )
    const timeout = setTimeout(() => job.cancel(), POLL_DURATION)

    const stop = () => {
      job.cancel()
      clearTimeout(timeout)
    }
  }

  client.on("clientReady", async () => {
    scheduleWithJitter("0 9 * * 1-5", START_JITTER, checker)
    scheduleWithJitter("30 13 * * 1-5", START_JITTER, checker)
  })

  const task = async ({ stop, endsAt }) => {
    try {
      const lessons = await getLessonsOfDay()
      const channel = client.channels.cache.get(config.channelAttendance)
      const now = new Date().getTime()
      const attendance = lessons.find(
        (lesson) =>
          lesson.attendanceSheet != null &&
          lesson.startDate <= now &&
          lesson.endDate > now
      )

      if (!attendance) {
        const hasLessonToWatch = lessons.some(
          (lesson) => lesson.startDate < endsAt && lesson.endDate > now,
        )

        if (!hasLessonToWatch) {
          console.log(`No lesson to watch, stop: ${formatDate(new Date())}`)
          stop()
          return
        }

        console.log(`No attendance: ${formatDate(new Date())}`)
        return
      }

      stop()

      const subject = attendance.schoolSubject.name
      const location = attendance.remote
        ? "`Distancielle`"
        : attendance.rooms.map((r) => r.name).join(", ")
      const teacher = attendance.teachers
        .map((t) => `${t.firstName} ${t.lastName}`)
        .join(", ")

      const startHour = new Date(attendance.startDate)
      const endHour = new Date(attendance.endDate)
      const lessonDuration = `${startHour.getHours()}h${startHour.getMinutes()} à ${endHour.getHours()}h${endHour.getMinutes()}h`

      const embed = new EmbedBuilder()
        .setTitle(`🔔 Le relevé de présence ${subject} est ouvert !`)
        .addFields(
          {
            name: "👨‍🏫 ┃ Professeur",
            value: " 🔹 `" + teacher + "` \n\u200B",
            inline: false,
          },
          {
            name: "🗺 ┃ Salle",
            value: "`" + location + "`",
            inline: true,
          },
          {
            name: "⏱ ┃ Heures",
            value: " 🔹 `" + lessonDuration + "` \n\u200B",
            inline: true,
          },
          {
            name: "📆 ┃ Date",
            value: " 🔹 `" + startHour.toLocaleDateString("fr-FR") + "`",
            inline: true,
          }
        )
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/2784/2784459.png")
        .setColor("#ff5876")
        .setTimestamp()

      channel.send({
        content: `<@&${config.roleLessonNotif}>`,
        embeds: [embed],
      })
    } catch (error) {
      console.error("Attendance error:", error)
    }
  }
}

export default attendanceCheck
