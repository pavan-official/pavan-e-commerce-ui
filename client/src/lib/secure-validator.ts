
/**
 * Secure Validator Replacement
 * QA-approved secure alternative to validator.js
 */

// Secure URL validation function
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Secure email validation function
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
  return emailRegex.test(email);
}

// Secure phone validation function
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

// Secure password validation function
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Secure input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

// Export all functions as default object
export default {
  isValidUrl,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  sanitizeInput,
};
