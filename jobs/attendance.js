import { EmbedBuilder } from "discord.js"
import { scheduleJob } from "node-schedule"
import config from "../config.js"
import { getLessonsOfDay } from "../libs/cesar.js"
import { formatDate } from "../utils/date.js"

const attendanceCheck = async (client) => {
  let cancelJobTimout

  const checker = async () => {
    const job = scheduleJob("*/1 * * * *", () => task(job))
    task(job)

    cancelJobTimout = setTimeout(job.cancel, 60 * 60 * 1000)
  }

  client.on("ready", async () => {
    checker()
    scheduleJob("0 9 * * *", checker)
    scheduleJob("30 13 * * *", checker)
  })

  const task = async (job) => {
    const lessons = await getLessonsOfDay()

    const channel = client.channels.cache.get(config.channelAttendance)
    const attendance = lessons.find((lesson) => lesson.signed === false)

    if (!attendance) {
      console.log(`No attendance: ${formatDate(new Date())}`)
      return
    }

    job.cancel()
    clearTimeout(cancelJobTimout)

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

    channel.send({ content: `<@&${config.roleLessonNotif}>`, embeds: [embed] })
  }
}

export default attendanceCheck
