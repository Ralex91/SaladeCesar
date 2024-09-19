import { EmbedBuilder } from "discord.js"

const alert = (message, color) => {
  let embed = new EmbedBuilder().setDescription(message).setColor(color)

  return embed
}

export default alert
