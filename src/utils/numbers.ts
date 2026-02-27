export const parseNumberInput = (value: string): string => {
  // Convert Arabic numerals to English
  const englishValue = value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  // Remove any non-digit, non-period characters
  return englishValue.replace(/[^0-9.]/g, '');
};
