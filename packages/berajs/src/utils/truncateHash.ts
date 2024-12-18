/**
 * Truncate a transaction or address hash and optionally format with uppercase letters and a lowercase 'x'.
 */
export const truncateHash = (
  address: `0x${string}` | string,
  startLength = 4,
  endLength = 4,
  formatUppercase = false,
) => {
  if (!address) return "";

  const formattedAddress = formatUppercase
    ? address.toUpperCase().replace(/^0X/, "0x")
    : address;

  return `${formattedAddress.substring(
    0,
    startLength,
  )}...${formattedAddress.substring(formattedAddress.length - endLength)}`;
};
