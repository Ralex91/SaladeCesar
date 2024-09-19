import config from "../config.js"
import alert from "../utils/alert.js"

const presenceCommand = {
  name: "presence",
  description:
    "Permet de recevoir les notifications pour les relevés de presence",

  async execute(interaction) {
    let embed

    if (!interaction.member.roles.cache.has(config.roleLessonNotif)) {
      interaction.member.roles.add(config.roleLessonNotif)
      embed = alert(`Les Notifications de présence sont activées ✅`, "#20ff48")
    } else {
      interaction.member.roles.remove(config.roleLessonNotif)
      embed = alert(
        `Les Notifications de présence sont désactivées ❌`,
        "#ff3408"
      )
    }

    interaction.reply({
      content: null,
      embeds: [embed],
      ephemeral: true,
    })
  },
}

export default presenceCommand
