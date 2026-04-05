import dayjs from "dayjs"
import {
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js"
import { scheduleJob } from "node-schedule"
import config from "../config.js"
import { getNextWeekWithLessons } from "../libs/cesar.js"
import { generateTimetable } from "../utils/timetable/generator.js"

const buildContent = (weekResult) => {
  const now = dayjs()
  const hasLessons = weekResult.lessons.some((l) =>
    dayjs(l.startDate).isSame(now.add(1, "day"), "day"),
  )
  const currentMonday = now.day(now.day() === 0 ? -6 : 1).startOf("day")
  const isCurrentWeek = weekResult.monday.isSame(currentMonday, "day")

  const title = `## 📆 ${isCurrentWeek ? "Emploi du temps" : "Emploi du temps de la prochaine semaine de cours"}`
  const phrase = hasLessons
    ? `📚  Il y a cours aujourd'hui, prépare-toi à esquiver le lancer de pelle du prof !`
    : `😴  Pas de cours aujourd'hui, personne pour lancer l'appel, donc pas de pelle à esquiver !`
  return `${title}\n${phrase}`
}

const lessonsOfDay = async (client) => {
  client.on("clientReady", async () => {
    const channel = client.channels.cache.get(config.channelLesson)

    const messages = await channel.messages.fetch({ limit: 10 })
    const existing = messages.find((m) => m.author.id === client.user.id)
    const message = existing ?? (await channel.send("⏳"))

    task(message)

    scheduleJob("0 17 * * *", () => task(message))
  })

  const task = async (message) => {
    try {
      const weekResult = await getNextWeekWithLessons()

      if (!weekResult) {
        const randomGif =
          config.imageNoLesson[
            Math.floor(Math.random() * config.imageNoLesson.length)
          ]
        const container = new ContainerBuilder()
          .setAccentColor(0x5865f2)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "## 😴  Pas de cours à venir\n*On est tranquille pendant un petit moment, personne pour lancer l'appel, donc pas de pelle à esquiver !*",
            ),
          )
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems({ media: { url: randomGif } }),
          )

        message.edit({
          content: "",
          embeds: [],
          components: [container],
          files: [],
          flags: MessageFlags.IsComponentsV2,
        })

        return
      }

      const buffer = await generateTimetable(
        weekResult.lessons,
        weekResult.monday,
      )
      const attachment = new AttachmentBuilder(buffer, {
        name: "timetable.png",
      })

      const container = new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(buildContent(weekResult)),
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems({
            media: { url: "attachment://timetable.png" },
          }),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Mis à jour le ${dayjs().format("DD/MM/YYYY à HH:mm")}`,
          ),
        )

      message.edit({
        content: "",
        embeds: [],
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      })
    } catch (error) {
      console.error("LessonsOfDay error: ", error)
    }
  }
}

export default lessonsOfDay
