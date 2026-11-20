const SAUDI_TZ = 'Asia/Riyadh';
const SAUDI_OFFSET = '+03:00';

export function parseUtc(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : value + 'Z');
  return isNaN(date.getTime()) ? null : date;
}

export type DateMode = 'date' | 'time' | 'datetime';

export function formatSaudi(value: string | Date | null | undefined, lang: 'ar' | 'en', mode: DateMode = 'datetime'): string {
  const date = parseUtc(value);
  if (!date) {
    return '';
  }
  const locale = lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
  const options: Intl.DateTimeFormatOptions = { timeZone: SAUDI_TZ };
  if (mode !== 'time') {
    options.day = 'numeric';
    options.month = 'long';
    options.year = 'numeric';
  }
  if (mode !== 'date') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatHijri(value: string | Date | null | undefined, lang: 'ar' | 'en'): string {
  const date = parseUtc(value);
  if (!date) {
    return '';
  }
  const locale = lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura-nu-latn' : 'en-u-ca-islamic-umalqura';
  return new Intl.DateTimeFormat(locale, { timeZone: SAUDI_TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function dayParts(value: string | Date | null | undefined, lang: 'ar' | 'en'): { day: string; month: string } {
  const date = parseUtc(value);
  if (!date) {
    return { day: '', month: '' };
  }
  const locale = lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
  const day = new Intl.DateTimeFormat(locale, { timeZone: SAUDI_TZ, day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat(locale, { timeZone: SAUDI_TZ, month: 'short' }).format(date);
  return { day, month };
}

export function toSaudiInput(value: string | Date | null | undefined): string {
  const date = parseUtc(value);
  if (!date) {
    return '';
  }
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export function fromSaudiInput(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.length === 16 ? value + ':00' : value;
  const date = new Date(normalized + SAUDI_OFFSET);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

export function isPast(value: string | null | undefined): boolean {
  const date = parseUtc(value);
  return !!date && date.getTime() < Date.now();
}
