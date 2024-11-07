import { EmbedBuilder } from "discord.js"
import fs from "fs"
import { scheduleJob } from "node-schedule"
import config from "../config.js"
import { findNewGrades, getGrades } from "../libs/cesar.js"
import { getHexRandomColor } from "../utils/color.js"

const gradresCheck = async (client) => {
  client.on("ready", async () => {
    scheduleJob("0 * * * *", () => task())
    task()
  })

  const task = async () => {
    try {
      const courseGrades = await getGrades()
      const channel = client.channels.cache.get(config.channelGrade)

      if (!fs.existsSync("./grades.json")) {
        fs.writeFileSync("./grades.json", JSON.stringify(courseGrades, null, 2))

        return
      }

      const savedGrades = JSON.parse(fs.readFileSync("./grades.json", "utf8"))
      const differences = findNewGrades(savedGrades, courseGrades)

      if (!differences.length) {
        return
      }

      const embeds = differences.map(({ lessonName, newGrades }) =>
        new EmbedBuilder()
          .setTitle(
            `📚 ┃ **${newGrades.length}** nouvelle${
              newGrades.length > 1 ? "s" : ""
            } note${newGrades.length > 1 ? "s" : ""} en **${lessonName}**`
          )
          .setFields(
            newGrades.map((g) => ({
              name: g.title,
              value: `Moyenne du groupe: **${g.groupAverage}**\nDate: **${g.date}**`,
              inline: true,
            }))
          )
          .setColor(getHexRandomColor())
          .setTimestamp()
      )

      channel.send({
        content: null,
        embeds,
      })

      fs.writeFileSync("./grades.json", JSON.stringify(courseGrades, null, 2))
    } catch (error) {
      console.error("New Grades error:", error)
    }
  }
}

export default gradresCheck
