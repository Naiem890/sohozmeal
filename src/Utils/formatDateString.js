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
