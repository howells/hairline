/** Minutes as a duration: "4 min", "2.6 h", "1.4 d". */
export const fmtDuration = (minutes: number) => {
  if (minutes < 59.5) {
    return `${Math.round(minutes)} min`;
  }
  const hours = minutes / 60;
  if (hours < 23.95) {
    return `${hours < 9.95 ? Number(hours.toFixed(1)) : Math.round(hours)} h`;
  }
  return `${Number((hours / 24).toFixed(1))} d`;
};
