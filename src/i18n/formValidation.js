// Keep native focus/constraint handling, with messages in the selected UI language.
export function localizeInvalidField(event, t) {
  const field = event.target;
  const key = field.validity.valueMissing ? 'Please complete this field.'
    : field.validity.typeMismatch && field.type === 'email' ? 'Enter a valid email address.'
      : field.validity.typeMismatch && field.type === 'url' ? 'Enter a valid URL.'
        : 'Check the value in this field.';
  field.setCustomValidity(t(key));
}
export function clearFieldValidation(event) {
  event.target.setCustomValidity?.('');
}
