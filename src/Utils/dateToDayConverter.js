export const dateToDayConverter = (dateString) => {
  const date = new Date(dateString);

  // Define an array of weekday names
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay();

  // Return the name of the day of the week
  return weekdays[dayOfWeek];
};
