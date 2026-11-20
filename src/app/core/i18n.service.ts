import { Injectable, computed, effect, signal } from '@angular/core';
import { ApiError } from './api.service';
import { DICT } from './dictionary';

export type Lang = 'ar' | 'en';
const STORAGE_KEY = 'safarat.lang';

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(this.initial());
  readonly isAr = computed(() => this.lang() === 'ar');
  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  private readonly missing = new Set<string>();

  constructor() {
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  readonly t = (key: string, params?: Record<string, string | number>): string => {
    const entry = DICT[key];
    if (!entry) {
      if (!this.missing.has(key)) {
        this.missing.add(key);
        console.warn('[i18n] missing key:', key);
      }
      return key;
    }
    let text = this.lang() === 'ar' ? entry[0] : entry[1];
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };

  readonly pick = (ar: string | null | undefined, en: string | null | undefined): string => {
    const value = this.lang() === 'ar' ? ar : en;
    return value || ar || en || '';
  };

  readonly name = (entity: { nameAr: string; nameEn: string } | null | undefined): string =>
    entity ? this.pick(entity.nameAr, entity.nameEn) : '';

  readonly error = (error: unknown): string => {
    if (error instanceof ApiError) {
      return this.pick(error.messageAr, error.messageEn);
    }
    return this.t('common.unexpectedError');
  };

  toggle(): void {
    this.lang.set(this.lang() === 'ar' ? 'en' : 'ar');
  }

  private initial(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ar';
  }
}
