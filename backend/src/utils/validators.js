/**
 * Validate IIIT email domain
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid IIIT email
 */
export const isIIITEmail = (email) => {
  const iiitDomains = ["@students.iiit.ac.in", "@research.iiit.ac.in"];
  return iiitDomains.some((domain) => email.toLowerCase().endsWith(domain));
};

/**
 * Check if registration is still open
 * @param {Date} deadline - Registration deadline
 * @returns {Boolean} True if registration is open
 */
export const isRegistrationOpen = (deadline) => {
  return new Date() < new Date(deadline);
};

/**
 * Check if event has capacity
 * @param {Number} limit - Registration limit
 * @param {Number} current - Current registrations
 * @returns {Boolean} True if capacity available
 */
export const hasCapacity = (limit, current) => {
  if (!limit) return true; // Unlimited
  return current < limit;
};

/**
 * Validate eligibility for event
 * @param {String} eventEligibility - Event eligibility (IIIT_ONLY, NON_IIIT_ONLY, ALL)
 * @param {String} participantType - Participant type (IIIT, NON_IIIT)
 * @returns {Boolean} True if eligible
 */
export const checkEligibility = (eventEligibility, participantType) => {
  if (eventEligibility === "ALL") return true;
  if (eventEligibility === "IIIT_ONLY") return participantType === "IIIT";
  if (eventEligibility === "NON_IIIT_ONLY") return participantType === "NON_IIIT";
  return false;
};

/**
 * Validate event dates
 * @param {Date} startDate - Event start date
 * @param {Date} endDate - Event end date
 * @param {Date} deadline - Registration deadline
 * @returns {Object} { valid: Boolean, message: String }
 */
export const validateEventDates = (startDate, endDate, deadline) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const regDeadline = new Date(deadline);

  if (start < now) {
    return { valid: false, message: "Event start date cannot be in the past" };
  }

  if (end < start) {
    return { valid: false, message: "Event end date must be after start date" };
  }

  if (regDeadline > start) {
    return {
      valid: false,
      message: "Registration deadline must be before event start",
    };
  }

  if (regDeadline < now) {
    return {
      valid: false,
      message: "Registration deadline cannot be in the past",
    };
  }

  return { valid: true };
};

/**
 * Generate random password
 * @param {Number} length - Password length
 * @returns {String} Random password
 */
export const generateRandomPassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};
