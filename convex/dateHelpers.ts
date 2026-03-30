/** Returns a Date for 24 hours ago (computed fresh on each call). */
export function getOneDayAgo(): Date {
  return new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
}

/** Returns a Date for 30 days ago (computed fresh on each call). */
export function getOneMonthAgo(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

/** Returns a Date for 7 days ago (computed fresh on each call). */
export function getOneWeekAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}
