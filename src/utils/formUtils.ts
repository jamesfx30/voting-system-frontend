
export interface FormError {
  field: string;
  message: string;
}

export const formatCardNumber = (value: string): string => {
  const chunks = [];
  for (let i = 0; i < value.length; i += 4) {
    chunks.push(value.slice(i, i + 4));
  }
  return chunks.join(' ');
};

export const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length > 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  
  return cleaned;
};

export const validatePaymentForm = (data: {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}): FormError[] => {
  const errors: FormError[] = [];
  
  // Validate card number
  if (!data.cardNumber.trim()) {
    errors.push({ field: 'cardNumber', message: 'Card number is required' });
  } else if (data.cardNumber.replace(/\s/g, '').length !== 16) {
    errors.push({ field: 'cardNumber', message: 'Card number must be 16 digits' });
  }
  
  // Validate expiry date
  if (!data.expiryDate.trim()) {
    errors.push({ field: 'expiryDate', message: 'Expiry date is required' });
  } else if (!/^\d{2}\/\d{2}$/.test(data.expiryDate)) {
    errors.push({ field: 'expiryDate', message: 'Expiry date must be in MM/YY format' });
  } else {
    const [month, year] = data.expiryDate.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (month < 1 || month > 12) {
      errors.push({ field: 'expiryDate', message: 'Invalid month' });
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.push({ field: 'expiryDate', message: 'Card has expired' });
    }
  }
  
  // Validate CVV
  if (!data.cvv.trim()) {
    errors.push({ field: 'cvv', message: 'CVV is required' });
  } else if (!/^\d{3,4}$/.test(data.cvv)) {
    errors.push({ field: 'cvv', message: 'CVV must be 3 or 4 digits' });
  }
  
  // Validate name
  if (!data.name.trim()) {
    errors.push({ field: 'name', message: 'Cardholder name is required' });
  }
  
  return errors;
};
