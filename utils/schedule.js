import { scheduleJob } from "node-schedule"

export const random = (min, max) => min + Math.random() * (max - min)

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const scheduleWithJitter = (cron, maxDelayMs, task) =>
  scheduleJob(cron, () => setTimeout(task, random(0, maxDelayMs)))

export const scheduleRandomInterval = (
  minMs,
  maxMs,
  task,
  { isActive = () => true, immediate = false } = {},
) => {
  let timer = null
  let stopped = false

  const loop = async () => {
    if (stopped) {
      return
    }

    if (isActive(new Date())) {
      await task()
    }

    if (!stopped) {
      timer = setTimeout(loop, random(minMs, maxMs))
    }
  }

  timer = setTimeout(loop, immediate ? 0 : random(minMs, maxMs))

  return {
    cancel: () => {
      stopped = true
      clearTimeout(timer)
    },
  }
}
