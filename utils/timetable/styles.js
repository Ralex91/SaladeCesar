import { TIMETABLE_THEME } from "../constants.js"

export const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    width: 1900,
    height: 760,
    background: TIMETABLE_THEME.bg,
    fontFamily: "JetBrains Mono",
  },
  headerRow: {
    display: "flex",
    height: 52,
    background: TIMETABLE_THEME.bg,
  },
  headerCell: (isToday) => ({
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: isToday ? TIMETABLE_THEME.cell.todayBg : "transparent",
    borderBottomWidth: isToday ? 3 : 0,
    borderBottomStyle: "solid",
    borderBottomColor: TIMETABLE_THEME.cell.todayBorder,
  }),
  headerText: (isToday) => ({
    color: isToday
      ? TIMETABLE_THEME.cell.todayText
      : TIMETABLE_THEME.text.secondary,
    fontWeight: 700,
    fontSize: TIMETABLE_THEME.fontSize.dayHeader,
  }),
  row: {
    display: "flex",
    flex: 1,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: TIMETABLE_THEME.border,
  },
  cell: (isToday, hasContent) => ({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    padding: 10,
    gap: 8,
    background: isToday
      ? TIMETABLE_THEME.cell.todayBg
      : TIMETABLE_THEME.cell.bg,
    justifyContent: "center",
    alignItems: hasContent ? "stretch" : "center",
  }),
  emptyCell: {
    color: TIMETABLE_THEME.text.empty,
    fontSize: TIMETABLE_THEME.fontSize.empty,
  },
  card: (color) => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    flex: 1,
    background: TIMETABLE_THEME.card.bg,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: color,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 14,
    paddingBottom: 14,
  }),
  cardGroup: {
    display: "flex",
    flexDirection: "column",
  },
  subject: (color) => ({
    color,
    fontWeight: 700,
    fontSize: TIMETABLE_THEME.fontSize.subject,
    marginBottom: 3,
    wordBreak: "break-all",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
  }),
  room: {
    color: TIMETABLE_THEME.text.primary,
    fontSize: TIMETABLE_THEME.fontSize.room,
    fontWeight: 600,
    marginBottom: 8,
  },
  time: {
    color: TIMETABLE_THEME.text.secondary,
    fontSize: TIMETABLE_THEME.fontSize.time,
    marginBottom: 3,
  },
  teacher: {
    color: TIMETABLE_THEME.text.muted,
    fontSize: TIMETABLE_THEME.fontSize.teacher,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    background: TIMETABLE_THEME.footer.bg,
    height: 72,
    paddingLeft: 20,
    paddingRight: 20,
  },
  footerText: {
    color: TIMETABLE_THEME.footer.text,
    fontWeight: 700,
    fontSize: TIMETABLE_THEME.fontSize.footer,
  },
  badge: (isCurrentWeek) => {
    const color = isCurrentWeek
      ? TIMETABLE_THEME.footer.badgeCurrent
      : TIMETABLE_THEME.footer.badgeNext
    return {
      color,
      background: color + "22",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: color,
      fontSize: TIMETABLE_THEME.fontSize.badge,
      fontWeight: 700,
      paddingLeft: 10,
      paddingRight: 10,
      paddingTop: 4,
      paddingBottom: 4,
    }
  },
}
