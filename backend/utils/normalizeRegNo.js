/**
 * Strips spaces and hyphens, and converts to uppercase.
 * Example: "KL 07 AB 1234" -> "KL07AB1234"
 */
const normalizeRegNo = (regNo) => {
  if (!regNo) return '';
  return regNo.toUpperCase().replace(/\s|-/g, '');
};

export default normalizeRegNo;