export default function formatDate(inputDate) {
  const [year, month] = inputDate.split("-");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const formattedDate = `${monthNames[Number(month) - 1]} ${year}`;
  return formattedDate;
}

export function formatDateTime(dateStr) {
  // Create a new Date object from the input string
  const dateObj = new Date(dateStr);

  // Extract the date part
  const formattedDate = dateObj.toISOString().split('T')[0];

  // Extract the time part (without milliseconds)
  const formattedTime = dateObj.toISOString().split('T')[1].split('.')[0];

  return { date: formattedDate, time: formattedTime };
}