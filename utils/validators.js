export const isValidPhoneNumber = (value) => {
  return /^[0-9]{10}$/.test(value);
};

export const isValidEmail = (value) => {
  return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
};

export const normalizePhoneNumber = (phone) => {
  if (typeof phone !== 'string' && typeof phone !== 'number') return null;
  let cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length > 10 && (cleanPhone.startsWith('91') || cleanPhone.startsWith('091'))) {
    if (cleanPhone.startsWith('091')) cleanPhone = cleanPhone.substring(3);
    else cleanPhone = cleanPhone.substring(2);
  }
  if (cleanPhone.length > 10) {
    cleanPhone = cleanPhone.slice(-10);
  }
  if (isValidPhoneNumber(cleanPhone)) {
    return cleanPhone;
  }
  return null;
};

export const processAltNumbers = (altNumbers, primaryNumber) => {
  const normalizedPrimary = normalizePhoneNumber(primaryNumber);
  let list = [];
  if (Array.isArray(altNumbers)) {
    list = altNumbers;
  } else if (typeof altNumbers === 'string') {
    list = altNumbers.split(',').map(s => s.trim());
  }
  const uniqueNormalized = new Set();
  for (const num of list) {
    const norm = normalizePhoneNumber(num);
    if (norm && norm !== normalizedPrimary) {
      uniqueNormalized.add(norm);
    }
  }
  return Array.from(uniqueNormalized);
};