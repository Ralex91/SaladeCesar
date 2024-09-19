import { ActivityType } from "discord.js"

const ready = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setPresence({
      activities: [{ name: `Cesar`, type: ActivityType.Watching }],
    })
  },
}

export default ready
