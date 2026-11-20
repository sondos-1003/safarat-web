import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ApiError } from './api.service';
import { I18n } from './i18n.service';

export const PATTERNS = {
  arabicName: /^[ء-ي ]+$/,
  englishName: /^[A-Za-z ]+$/,
  phone: /^05\d{8}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
  https: /^\s*https:\/\/[^\s/?#]+\.[^\s]+\s*$/,
};

export function patternValidator(regex: RegExp, errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '') as string;
    return !value || regex.test(value) ? null : { [errorKey]: true };
  };
}

export const requiredText = (max = 200) => [Validators.required, Validators.maxLength(max), noBlank];

export function noBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0 ? { required: true } : null;
}

export function applyServerErrors(form: FormGroup, error: unknown, i18n: I18n): void {
  if (!(error instanceof ApiError)) {
    return;
  }
  for (const fieldError of error.fieldErrors) {
    const control = form.get(fieldError.field);
    if (control) {
      control.setErrors({ server: i18n.pick(fieldError.messageAr, fieldError.messageEn) });
      control.markAsTouched();
    }
  }
}

export function errorText(control: AbstractControl | null, i18n: I18n): string {
  if (!control || !control.touched || !control.errors) {
    return '';
  }
  const errors = control.errors;
  if (errors['server']) {
    return errors['server'] as string;
  }
  if (errors['required']) {
    return i18n.t('val.required');
  }
  if (errors['email']) {
    return i18n.t('val.email');
  }
  if (errors['maxlength']) {
    return i18n.t('val.maxLength', { n: errors['maxlength'].requiredLength });
  }
  if (errors['min'] || errors['max']) {
    return i18n.t('val.range', { min: errors['min']?.min ?? errors['max']?.min ?? '', max: errors['max']?.max ?? '' });
  }
  for (const key of ['arabicName', 'englishName', 'phone', 'password', 'https', 'mismatch']) {
    if (errors[key]) {
      return i18n.t('val.' + key);
    }
  }
  return i18n.t('val.invalid');
}
