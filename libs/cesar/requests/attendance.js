import fs from "fs"
import { parse } from "node-html-parser"
import config from "../../../config.js"
import { generateSignatureDataUrl } from "../../../utils/signature.js"
import { cesarClient, fetchPage } from "../client.js"
import { CALENDAR, SIGNATURE } from "../constants.js"
import { readCalendarAttr } from "./calendar.js"

const readSignatureProps = (root) => {
  const raw = root
    .querySelector(SIGNATURE.selector)
    ?.getAttribute(SIGNATURE.propsAttr)

  return raw ? JSON.parse(raw) : null
}

const isSignatureSaved = (props) => typeof props?.signature === "string"

const createSignatureImage = () => {
  if (!fs.existsSync(SIGNATURE.file)) {
    throw Error(
      `Signature file ${SIGNATURE.file} not found (create it with html/sign-capture.html)`,
    )
  }

  const samples = JSON.parse(fs.readFileSync(SIGNATURE.file, "utf8"))

  if (!Array.isArray(samples) || samples.length === 0) {
    throw Error(`Signature file ${SIGNATURE.file} contains no signature`)
  }

  return generateSignatureDataUrl(samples)
}

const postSignatureComponent = async ({ page, action, data }) => {
  const form = new FormData()
  form.set("data", JSON.stringify(data))

  const path = action
    ? `${SIGNATURE.componentPath}/${action}`
    : SIGNATURE.componentPath

  const { body } = await cesarClient.post(path, {
    headers: {
      Accept: "application/vnd.live-component+html",
      "X-Requested-With": "XMLHttpRequest",
      "X-Live-Url": `/${page}`,
      Referer: `${config.baseUrl}/${page}`,
    },
    context: { mode: "cors" },
    body: form,
  })

  return readSignatureProps(parse(body))
}

const toSignatureLine = (lesson, { studentId, maxMs, serverNow }) => {
  const line = lesson.attendanceSheet?.attendanceSheetLines?.find(
    (l) => l.planningGroupSubscription?.studentRegistration?.uuid === studentId,
  )

  if (!line) {
    return []
  }

  const secondsLeft = Math.round((line.createdAt + maxMs - serverNow) / 1000)
  const signed =
    line.signature?.signed === true || line.attendanceWithoutSignature === true

  return {
    lessonId: lesson.uuid ?? lesson.id,
    subject: lesson.schoolSubject?.name,
    secondsLeft,
    signed,
    open: line.signingOff === true && secondsLeft > 0 && !signed,
  }
}

export const getSignatureLines = async () => {
  const fetchedAt = Date.now()
  const root = await fetchPage()
  const attr = (name) => readCalendarAttr(root, name)

  const schedules = attr(CALENDAR.attrs.schedules)

  if (!schedules) {
    throw Error(
      "Cesar: calendar not found (invalid session or expired password?)",
    )
  }

  const context = {
    studentId: JSON.parse(attr(CALENDAR.attrs.student))?.uuid,
    maxMs: Number(attr(CALENDAR.attrs.maxAttendance)) * 60_000,
    serverNow:
      Number(attr(CALENDAR.attrs.serverTime)) * 1000 + (Date.now() - fetchedAt),
  }

  return JSON.parse(schedules).flatMap((lesson) =>
    toSignatureLine(lesson, context),
  )
}

export const signAttendance = async () => {
  const lines = await getSignatureLines()
  const lesson = lines.find((line) => line.open)

  if (!lesson) {
    throw Error("Cesar: no open signature window")
  }

  const page = `mes-cours/${lesson.lessonId}/emargement`
  const props = readSignatureProps(await fetchPage(page))

  if (!props) {
    throw Error("Cesar: signature component not found")
  }

  if (isSignatureSaved(props)) {
    throw Error("Cesar: attendance already signed")
  }

  const updated = await postSignatureComponent({
    page,
    data: {
      props,
      updated: { "signature.data": createSignatureImage() },
    },
  })

  const signed = await postSignatureComponent({
    page,
    action: "signed",
    data: { props: updated, updated: {}, args: {} },
  })

  if (!isSignatureSaved(signed)) {
    throw Error("Cesar: signature was not saved")
  }
}
