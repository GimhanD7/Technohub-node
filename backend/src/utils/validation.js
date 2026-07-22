const PASSWORD_REQUIREMENTS =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

function normalizePhoneNumber(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getPhoneError(phoneNumber) {
  const phone = normalizePhoneNumber(phoneNumber);

  if (!phone) return "Phone number is required.";
  if (!/^\d+$/.test(phone)) return "Phone number can only contain numbers.";
  if (phone.length < 9 || phone.length > 15) return "Phone number must be 9 to 15 digits long.";

  return "";
}

function getEmailError(email, { required = false } = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return required ? "Email address is required." : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Please enter a valid email address.";
  }

  return "";
}

function getPasswordError(password, { required = false } = {}) {
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

function getOtpError(otp) {
  const value = String(otp || "").trim();

  if (!/^\d{6}$/.test(value)) return "Please enter a valid 6-digit OTP.";

  return "";
}

const EDUCATION_CATEGORIES = new Set([
  "school",
  "o_l",
  "a_l",
  "university",
  "vocational",
  "professional",
]);

function normalizeEducationCategory(value) {
  const normalized = String(value || "").trim().toLowerCase().replaceAll("/", "_");
  return EDUCATION_CATEGORIES.has(normalized) ? normalized : null;
}

function getEducationCategoryError(value, { required = false } = {}) {
  if (!String(value || "").trim()) return required ? "Education category is required for students." : "";
  return normalizeEducationCategory(value) ? "" : "Please select a valid education category.";
}

module.exports = {
  getEmailError,
  getEducationCategoryError,
  getOtpError,
  getPasswordError,
  getPhoneError,
  normalizeEmail,
  normalizeEducationCategory,
  normalizePhoneNumber,
  PASSWORD_REQUIREMENTS,
};

