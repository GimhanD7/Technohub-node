export const PASSWORD_REQUIREMENTS =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

export const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export function getPhoneError(phoneNumber) {
  const phone = String(phoneNumber || "").trim();

  if (!phone) return "Phone number is required.";
  if (!/^\d+$/.test(phone)) return "Phone number can only contain numbers.";
  if (phone.length < 9 || phone.length > 15) return "Phone number must be 9 to 15 digits long.";

  return "";
}

export function getEmailError(email, { required = false } = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return required ? "Email address is required." : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Please enter a valid email address.";
  }

  return "";
}

export function getPasswordError(password, { required = false } = {}) {
  const value = String(password || "");

  if (!value) return required ? "Password is required." : "";
  if (value.length < 8) return PASSWORD_REQUIREMENTS;
  if (/\s/.test(value)) return "Password cannot contain spaces.";
  if (!/[A-Z]/.test(value)) return PASSWORD_REQUIREMENTS;
  if (!/[a-z]/.test(value)) return PASSWORD_REQUIREMENTS;
  if (!/\d/.test(value)) return PASSWORD_REQUIREMENTS;
  if (!/[^A-Za-z0-9]/.test(value)) return PASSWORD_REQUIREMENTS;

  return "";
}

