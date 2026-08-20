export const displayDate = (value: string) => {
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export const displayTimeRange = (start: string, end: string) => `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`;
