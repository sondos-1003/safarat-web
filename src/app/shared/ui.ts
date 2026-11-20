import { Component, Pipe, PipeTransform, computed, inject, input, model, output } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ConfirmService } from '../core/confirm.service';
import { DateMode, formatHijri, formatSaudi } from '../core/date';
import { errorText } from '../core/forms';
import { I18n } from '../core/i18n.service';
import { ToastService } from '../core/toast.service';

@Pipe({ name: 'sdate', pure: false })
export class SaudiDatePipe implements PipeTransform {
  private readonly i18n = inject(I18n);
  transform(value: string | Date | null | undefined, mode: DateMode = 'datetime'): string {
    return formatSaudi(value, this.i18n.lang(), mode);
  }
}

@Pipe({ name: 'hijri', pure: false })
export class HijriPipe implements PipeTransform {
  private readonly i18n = inject(I18n);
  transform(value: string | Date | null | undefined): string {
    return formatHijri(value, this.i18n.lang());
  }
}

@Component({
  selector: 'app-logo',
  template: `
    <span class="logo" [class.light]="light()">
      <svg viewBox="0 0 64 64" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
        <g fill="none" stroke="#c9a24a" stroke-width="2.2">
          <rect x="14" y="14" width="36" height="36" />
          <rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)" />
        </g>
        <path d="M32 19c6 8 10 13 10 18a10 10 0 0 1-20 0c0-5 4-10 10-18z" fill="#c23b5a" />
        <path d="M32 26c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" fill="#f8e3e8" opacity=".75" />
      </svg>
      @if (!iconOnly()) {
        <span class="words">
          <b>{{ i18n.t('brand.name') }}</b>
          <small>{{ i18n.t('brand.tag') }}</small>
        </span>
      }
    </span>
  `,
  styles: `
    .logo { display: inline-flex; align-items: center; gap: 0.6rem; }
    .words { display: flex; flex-direction: column; line-height: 1.1; }
    b { font-family: var(--font-display); font-size: 1.45rem; color: var(--oud-900); }
    small { font-size: 0.68rem; letter-spacing: 0.18em; color: var(--gold-600); font-weight: 700; text-transform: uppercase; }
    .light b { color: #fff; }
    .light small { color: var(--gold-300); }
  `,
})
export class LogoComponent {
  readonly i18n = inject(I18n);
  readonly size = input(44);
  readonly light = input(false);
  readonly iconOnly = input(false);
}

@Component({
  selector: 'app-modal',
  template: `
    @if (open()) {
      <div class="backdrop" (mousedown)="onBackdrop($event)">
        <div class="modal" [class.wide]="wide()" role="dialog" aria-modal="true">
          <header>
            <h3>{{ title() }}</h3>
            <button type="button" class="close" (click)="closed.emit()" aria-label="close">✕</button>
          </header>
          <div class="body"><ng-content /></div>
          <footer><ng-content select="[footer]" /></footer>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; background: rgba(19, 10, 8, 0.62); backdrop-filter: blur(3px); z-index: 900; display: grid; place-items: center; padding: 1rem; animation: fade 0.2s; }
    .modal { background: #fff; border-radius: 22px; width: min(560px, 100%); max-height: 92vh; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); animation: pop 0.25s ease; }
    .modal.wide { width: min(860px, 100%); }
    header { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.5rem; border-bottom: 1px solid var(--line); background: var(--cream-100); border-radius: 22px 22px 0 0; }
    h3 { margin: 0; }
    .close { border: 0; background: none; font-size: 1.1rem; cursor: pointer; color: var(--muted); width: 34px; height: 34px; border-radius: 50%; }
    .close:hover { background: var(--cream-200); }
    .body { padding: 1.5rem; overflow-y: auto; }
    footer:empty { display: none; }
    footer { padding: 1rem 1.5rem; border-top: 1px solid var(--line); display: flex; gap: 0.6rem; justify-content: flex-end; flex-wrap: wrap; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { opacity: 0; transform: translateY(16px) scale(0.97); } }
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly wide = input(false);
  readonly closed = output<void>();

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.closed.emit();
    }
  }
}

@Component({
  selector: 'app-pagination',
  template: `
    @if (totalPages() > 1) {
      <nav class="pager">
        <button class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)">{{ i18n.t('common.prev') }}</button>
        <span class="small muted">{{ i18n.t('common.pageOf', { page: page(), total: totalPages() }) }}</span>
        <button class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">{{ i18n.t('common.next') }}</button>
      </nav>
    }
  `,
  styles: `.pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.25rem; }`,
})
export class PaginationComponent {
  readonly i18n = inject(I18n);
  readonly page = input(1);
  readonly totalPages = input(0);
  readonly pageChange = output<number>();

  go(page: number): void {
    this.pageChange.emit(page);
  }
}

@Component({
  selector: 'app-field',
  template: `
    <div class="field">
      @if (label()) {
        <label>{{ label() }}@if (required()) { <span class="req">*</span> }</label>
      }
      <ng-content />
      @if (errorMessage(); as message) {
        <span class="field-error">{{ message }}</span>
      } @else if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: `.req { color: var(--rose-600); margin-inline-start: 2px; }`,
})
export class FieldComponent {
  private readonly i18n = inject(I18n);
  readonly label = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly control = input<AbstractControl | null>(null);

  protected errorMessage(): string {
    return errorText(this.control(), this.i18n);
  }
}

@Component({
  selector: 'app-state-badge',
  template: `<span class="badge" [class]="cls()">{{ label() }}</span>`,
})
export class StateBadgeComponent {
  readonly code = input('');
  readonly label = input('');

  cls(): string {
    switch (this.code()) {
      case 'Open':
      case 'Accepted':
      case 'Published':
      case 'active':
        return 'b-green';
      case 'Full':
      case 'Pending':
      case 'RegistrationClosed':
        return 'b-amber';
      case 'Running':
        return 'b-blue';
      case 'Cancelled':
      case 'Rejected':
      case 'CancelledByParticipant':
      case 'Withdrawn':
      case 'suspended':
        return 'b-red';
      case 'Ended':
        return 'b-dark';
      default:
        return '';
    }
  }
}

@Component({
  selector: 'app-stars',
  template: `
    <span class="stars" [style.fontSize.px]="size()">
      @for (n of [1, 2, 3, 4, 5]; track n) {
        <span [class.off]="n > value()" [class.edit]="editable()" (click)="pick(n)">★</span>
      }
    </span>
  `,
  styles: `.edit { cursor: pointer; transition: transform 0.15s; } .edit:hover { transform: scale(1.25); }`,
})
export class StarsComponent {
  readonly value = model(0);
  readonly editable = input(false);
  readonly size = input(18);

  pick(n: number): void {
    if (this.editable()) {
      this.value.set(n);
    }
  }
}

@Component({
  selector: 'app-empty',
  template: `
    <div class="empty">
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <g fill="none" stroke="#c9a24a" stroke-width="1.6"><rect x="12" y="12" width="40" height="40" /><rect x="12" y="12" width="40" height="40" transform="rotate(45 32 32)" /><circle cx="32" cy="32" r="8" /></g>
      </svg>
      <p>{{ text() }}</p>
      <ng-content />
    </div>
  `,
  styles: `.empty { text-align: center; padding: 3rem 1rem; color: var(--muted); } p { margin: 0.8rem 0 1rem; font-weight: 600; }`,
})
export class EmptyComponent {
  readonly text = input('');
}

@Component({
  selector: 'app-overlays',
  template: `
    <div class="toasts">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="toast.kind" (click)="toasts.dismiss(toast.id)">
          <span class="ico">{{ toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i' }}</span>
          {{ toast.text }}
        </div>
      }
    </div>
    @if (confirm.current(); as request) {
      <div class="cbackdrop">
        <div class="cbox">
          <h3>{{ request.title }}</h3>
          <p>{{ request.message }}</p>
          <div class="row end">
            <button class="btn btn-ghost" (click)="confirm.answer(false)">{{ request.cancelLabel }}</button>
            <button class="btn" [class.btn-danger]="request.danger" [class.btn-primary]="!request.danger" (click)="confirm.answer(true)">{{ request.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .toasts { position: fixed; inset-block-end: 1.25rem; inset-inline-start: 1.25rem; z-index: 1200; display: flex; flex-direction: column; gap: 0.6rem; max-width: min(420px, calc(100vw - 2.5rem)); }
    .toast { display: flex; gap: 0.7rem; align-items: flex-start; background: var(--oud-900); color: #fff; padding: 0.85rem 1.1rem; border-radius: 14px; box-shadow: var(--shadow-lg); font-weight: 600; font-size: 0.93rem; cursor: pointer; animation: slide 0.3s ease; border-inline-start: 4px solid var(--gold-500); }
    .toast.success { border-color: #43b581; } .toast.error { border-color: #ef5b5b; }
    .ico { width: 22px; height: 22px; flex: none; border-radius: 50%; background: rgba(255, 255, 255, 0.16); display: grid; place-items: center; font-size: 0.8rem; }
    .cbackdrop { position: fixed; inset: 0; z-index: 1100; background: rgba(19, 10, 8, 0.62); display: grid; place-items: center; padding: 1rem; backdrop-filter: blur(3px); }
    .cbox { background: #fff; border-radius: 20px; padding: 1.6rem; width: min(440px, 100%); box-shadow: var(--shadow-lg); }
    @keyframes slide { from { opacity: 0; transform: translateY(14px); } }
  `,
})
export class OverlaysComponent {
  readonly toasts = inject(ToastService);
  readonly confirm = inject(ConfirmService);
}
