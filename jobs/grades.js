import { EmbedBuilder } from "discord.js"
import fs from "fs"
import config from "../config.js"
import { findNewGrades, getGrades } from "../libs/cesar/requests/grades.js"
import { getHexRandomColor } from "../utils/color.js"
import { scheduleRandomInterval } from "../utils/schedule.js"

const CHECK_INTERVAL = { min: 45 * 60_000, max: 90 * 60_000 }
const ACTIVE_FROM_HOUR = 7

const gradresCheck = async (client) => {
  client.on("clientReady", async () => {
    task()
    scheduleRandomInterval(CHECK_INTERVAL.min, CHECK_INTERVAL.max, task, {
      isActive: (now) => now.getHours() >= ACTIVE_FROM_HOUR,
    })
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
