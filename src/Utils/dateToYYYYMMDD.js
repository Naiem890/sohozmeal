export const dateToYYYYMMDD = (date) => {
  console.log("date", date);

  // Return the date in YYYY-MM-DD format
  return date.toISOString().split("T")[0];
};
