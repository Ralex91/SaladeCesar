import { EmbedBuilder } from "discord.js"
import { scheduleJob } from "node-schedule"
import config from "../config.js"
import { getLessonsOfDay } from "../libs/cesar.js"

const lessonsOfDay = async (client) => {
  client.on("ready", async () => {
    const channel = client.channels.cache.get(config.channelLesson)
    await channel.bulkDelete(1, true)

    const message = await channel.send("🤔")
    task(message)

    scheduleJob("0 6 * * *", () => task(message))
  })

  const task = async (message) => {
    try {
      const calandar = await getLessonsOfDay()

      const lessonEmbed = calandar.map((lesson, i) =>
        new EmbedBuilder()
          .setTitle(`**📚   \u200B${lesson.schoolSubject.name}**`)
          .addFields(
            {
              name: "👨‍🏫 ┃ Professeur",
              value:
                "`" +
                lesson.teachers
                  .map((t) => `${t.firstName} ${t.lastName}`)
                  .join(", ") +
                "`",
              inline: true,
            },
            {
              name: "\u200B",
              value: "\u200B",
              inline: true,
            },
            {
              name: "🗺 ┃ Salle",
              value: lesson.remote
                ? "`Distancielle`"
                : "`" + lesson.rooms.map((r) => r.name).join(", ") + "`",
              inline: true,
            }
          )
          .setColor(config.lessonsStyle[i].color)
          .setThumbnail(config.lessonsStyle[i].image)
          .setTimestamp()
      )

      if (!lessonEmbed.length) {
        const noLessonEmbed = new EmbedBuilder()
          .setColor("#5865F2")
          .setImage(
            config.imageNoLesson[
              Math.floor(Math.random() * config.imageNoLesson.length)
            ]
          )

        message.edit({
          content: `>>> Il n'y a pas de pelle a esquivé aujourd'hui 🤗`,
          embeds: [noLessonEmbed],
        })

        return
      }

      const date = new Date().toLocaleDateString("fr-FR")
      message.edit({
        content: `>>> **Voici les cours du ${date} 📆**`,
        embeds: lessonEmbed,
      })
    } catch (error) {
      console.error("LessonsOfDay error: ", error)
    }
  }
}

export default lessonsOfDay
