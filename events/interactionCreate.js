import { EmbedBuilder } from "discord.js"

const interactionCreate = {
  name: "interactionCreate",
  once: false,

  async execute(interaction, client) {
    if (interaction.isCommand || interaction.isContextMenu()) {
      const command = client.commands.get(interaction.commandName)
      if (!command)
        return (
          interaction.reply({
            embds: [
              new EmbedBuilder()
                .setColor("#FF9900")
                .setDescription("Command Error"),
            ],
          }) && client.commands.delete(interaction.commandName)
        )

      command.execute(interaction, client)
    }
  },
}

export default interactionCreate
