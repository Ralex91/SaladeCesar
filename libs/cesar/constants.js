import config from "../../config.js"

export const LOGIN_URLS = [
  `${config.baseUrl}/connexion`,
  `${config.baseUrl}/login`,
]
export const CVEC_URLS = [
  `${config.baseUrl}/televersement/cvec`,
  `${config.baseUrl}/upload/cvec`,
]

export const GRADES = {
  selectors: {
    courses: ".accordion-collapse .accordion-item",
    courseName: ".accordion-button .h5",
    courseGrades: ".card",
    locked: ".accordion-button svg",
    grade: ".badge.text-bg-primary.fw-normal",
    title: ".card-header .h6",
    comment: ".card-text",
    row: ".d-flex.justify-content-between span:not(.h6)",
  },
  rowIndex: {
    date: 0,
    coef: 1,
    groupAverage: 3,
  },
}

export const CALENDAR = {
  selector: "[data-controller='tui-calendar']",
  attrPrefix: "data-tui-calendar-",
  attrs: {
    schedules: "event-lesson-schedules",
    student: "student-registration",
    maxAttendance: "max-time-attendance",
    serverTime: "time-server",
  },
}

const SIGNATURE_COMPONENT = "Attendance:AttendanceStudentSignatureComponent"

export const SIGNATURE = {
  componentPath: `_components/${SIGNATURE_COMPONENT}`,
  selector: `[data-live-name-value="${SIGNATURE_COMPONENT}"]`,
  propsAttr: "data-live-props-value",
  file: "./signature.json",
}

export const SESSION = {
  cookieName: "PHPSESSID",
  file: "./sessid.txt",
}

export const CHROME = {
  channelsUrl:
    "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json",
  fallbackMilestone: "158",
  grease: {
    chars: [" ", "(", ":", "-", ".", "/", ")", ";", "=", "?", "_"],
    versions: ["8", "99", "24"],
    orders: [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ],
  },
  headers: {
    common: {
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    navigate: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "upgrade-insecure-requests": "1",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      priority: "u=0, i",
    },
    cors: {
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      priority: "u=1, i",
    },
  },
  headerOrder: {
    navigate: [
      "content-length",
      "cache-control",
      "sec-ch-ua",
      "sec-ch-ua-mobile",
      "sec-ch-ua-platform",
      "origin",
      "content-type",
      "upgrade-insecure-requests",
      "user-agent",
      "accept",
      "sec-fetch-site",
      "sec-fetch-mode",
      "sec-fetch-user",
      "sec-fetch-dest",
      "referer",
      "accept-encoding",
      "accept-language",
      "cookie",
      "priority",
    ],
    cors: [
      "content-length",
      "sec-ch-ua-platform",
      "x-requested-with",
      "x-live-url",
      "user-agent",
      "accept",
      "sec-ch-ua",
      "content-type",
      "sec-ch-ua-mobile",
      "origin",
      "sec-fetch-site",
      "sec-fetch-mode",
      "sec-fetch-dest",
      "referer",
      "accept-encoding",
      "accept-language",
      "cookie",
      "priority",
    ],
  },
}
