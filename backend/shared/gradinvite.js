export const RWANDA_MOBILE_PATTERN = /^07(2|3|8|9)\d{7}$/;

export function isValidRwandaMobile(phone) {
  return RWANDA_MOBILE_PATTERN.test(phone.trim());
}

export function countIndividualInvitations(invitees) {
  return invitees.length;
}