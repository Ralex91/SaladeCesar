import fs from "fs"

const jobs = async (client) => {
  const jobsFiles = fs
    .readdirSync("./jobs")
    .filter((file) => file.endsWith(".js"))

  for (const file of jobsFiles) {
    const job = await import(`../jobs/${file}`)
    job.default(client)
  }
}

export default jobs
