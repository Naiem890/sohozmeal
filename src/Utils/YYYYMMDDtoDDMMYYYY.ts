export default function convertToDDMMYYYY(dateString: string): string {
  // Split the input date string into an array [yyyy, mm, dd]
  const [year, month, day] = dateString.split("-");

  // Return the date in the format dd-mm-yyyy
  return `${day}-${month}-${year}`;
}
