export function formatUsd(input: string | number, maxLength?: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  try {
    const isNumber = (value: any): value is number => typeof value === "number";
    const isString = (value: any): value is string => typeof value === "string";

    if (!isNumber(input) && !isString(input)) {
      return formatter.format(0);
    }

    let num: number;

    if (isString(input)) {
      num = parseFloat(input);
      if (Number.isNaN(num)) {
        num = 0;
      }
    } else {
      num = input;
      if (Number.isNaN(num)) {
        num = 0;
      }
    }

    const formatted = formatter.format(num);

    // Use exponential formatting only when necessary
    if (maxLength && formatted.length > maxLength) {
      const exponentialFormatted = num.toExponential(3);
      return `${exponentialFormatted} (USD)`;
    }

    return formatted;
  } catch (e) {
    console.log(e);
    return formatter.format(0);
  }
}
