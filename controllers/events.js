import fs from "fs"

const events = async (client) => {
  const eventsFiles = fs
    .readdirSync("./events")
    .filter((file) => file.endsWith(".js"))

  for (const file of eventsFiles) {
    const eventObject = await import(`../events/${file}`)
    const event = eventObject.default

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client))
    } else {
      client.on(event.name, (...args) => event.execute(...args, client))
    }
  }
}

export default events
