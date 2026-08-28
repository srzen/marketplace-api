// validateInput.js: Returns true if the input is a valid number,
// a non-empty string after trimming whitespace or a non-empty array.

function validateInput(input) {
  if (typeof input === "number") return input > 0;
  if (typeof input === "string") return input.trim().length > 0;
  if (Array.isArray(input)) return input.length > 0;
  return false;
}

module.exports = validateInput;
