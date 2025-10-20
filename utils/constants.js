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
