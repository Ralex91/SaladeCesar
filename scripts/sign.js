import "dotenv/config"
import { signAttendance } from "../libs/cesar/index.js"

try {
  await signAttendance()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
