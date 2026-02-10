/**
 * Email validation.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password strength validation.
 * Requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

/**
 * Get password strength feedback.
 */
export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels: Record<number, 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong'> = {
    0: 'Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
    5: 'Very Strong',
  };

  return { score: Math.min(score, 4), label: labels[score] ?? 'Weak' };
}

/**
 * Phone number validation (basic international format).
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[1-9]\d{7,14}$/.test(cleaned);
}

/**
 * Required field validation.
 */
export function isRequired(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0;
}

/**
 * Number range validation.
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate a full support/feedback form.
 */
export function validateSupportForm(data: { name: string; email: string; message: string }): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!isRequired(data.name)) errors.name = 'Name is required';
  if (!isRequired(data.email)) errors.email = 'Email is required';
  else if (!isValidEmail(data.email)) errors.email = 'Invalid email address';
  if (!isRequired(data.message)) errors.message = 'Message is required';

  return { valid: Object.keys(errors).length === 0, errors };
}
