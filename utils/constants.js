import config from "../config.js"

export const LOGIN_URLS = [
  `${config.baseUrl}/connexion`,
  `${config.baseUrl}/login`,
]
export const CVEC_URLS = [
  `${config.baseUrl}/televersement/cvec`,
  `${config.baseUrl}/upload/cvec`,
]

export const SELECTOR_COURSES = ".accordion-collapse .accordion-item"
export const SELECTOR_COURSE_NAME = ".accordion-button .h5"
export const SELECTOR_COURSE_GRADES = ".card"
export const SELECTOR_GRADE = ".badge.text-bg-primary.fw-normal"
export const SELECTOR_GRADE_TITLE = ".card-header .h6"
export const SELECTOR_GRADE_COMMENT = ".card-text"
export const SELECTOR_GRADE_ROW =
  ".d-flex.justify-content-between span:not(.h6)"
export const SELECTOR_GRADE_ROW_DATE = 0
export const SELECTOR_GRADE_ROW_COEF = 1
export const SELECTOR_GRADE_ROW_GROUP_AVG = 3

export const TIMETABLE_DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
]
export const TIMETABLE_AFTERNOON_HOUR = 13

export const TIMETABLE_THEME = {
  subjectColors: [
    "#60a5fa",
    "#fb923c",
    "#4ade80",
    "#c084fc",
    "#f87171",
    "#34d399",
    "#fbbf24",
    "#38bdf8",
    "#f472b6",
    "#a78bfa",
    "#2dd4bf",
    "#facc15",
    "#fb7185",
    "#818cf8",
    "#86efac",
    "#fdba74",
  ],
  bg: "#313338",
  border: "#3a3c41",
  footer: {
    bg: "#232428",
    text: "#ffffff",
    textMuted: "#ffffff",
    badgeCurrent: "#4ade80",
    badgeNext: "#fbbf24",
  },
  header: {
    bg: "#2b2d31",
  },
  cell: {
    bg: "#2b2d31",
    todayBg: "#3c3f45",
    todayAccent: "#5865f2",
    todayText: "#ffffff",
    todayBorder: "#ffffff",
  },
  card: {
    bg: "#383a40",
  },
  text: {
    primary: "#dbdee1",
    secondary: "#b5bac1",
    muted: "#b5bac1",
    empty: "#4e5058",
  },
  fontSize: {
    subject: 38,
    room: 32,
    time: 30,
    teacher: 30,
    empty: 40,
    dayHeader: 32,
    footer: 32,
    badge: 30,
  },
}
