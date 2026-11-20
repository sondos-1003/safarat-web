import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PATTERNS, applyServerErrors, noBlank, patternValidator } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { Lookup } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { formatSaudi } from '../../core/date';
import { FieldComponent } from '../../shared/ui';

// ───────────────────────────── Login ─────────────────────────────
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent],
  template: `
    <h1 class="title">{{ i18n.t('login.title') }}</h1>
    <p class="muted mb-3">{{ i18n.t('login.subtitle') }}</p>

    @if (error()) {
      <div class="alert alert-error mb-2">{{ error() }}</div>
    }
    @if (needsConfirmation()) {
      <div class="alert alert-warn mb-2">
        {{ i18n.t('login.notConfirmed') }}
        <button type="button" class="link" (click)="resend()" [disabled]="resending()">{{ i18n.t('login.resend') }}</button>
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-field [label]="i18n.t('f.email')" [control]="form.controls.email">
        <input class="input ltr" type="email" formControlName="email" autocomplete="username" [class.invalid]="form.controls.email.touched && form.controls.email.invalid" />
      </app-field>
      <app-field [label]="i18n.t('f.password')" [control]="form.controls.password">
        <input class="input ltr" type="password" formControlName="password" autocomplete="current-password" [class.invalid]="form.controls.password.touched && form.controls.password.invalid" />
      </app-field>
      <div class="row between mb-2">
        <span></span>
        <a routerLink="/forgot-password" class="small bold">{{ i18n.t('login.forgot') }}</a>
      </div>
      <button class="btn btn-primary btn-block" [disabled]="busy()">
        @if (busy()) { <span class="spinner"></span> } {{ i18n.t('nav.login') }}
      </button>
    </form>
    <p class="mt-3 center muted">{{ i18n.t('login.noAccount') }} <a routerLink="/register" class="bold">{{ i18n.t('nav.register') }}</a></p>
  `,
  styles: `.title { font-size: 2.4rem; margin-bottom: 0.3rem; } .link { background: none; border: 0; padding: 0; color: var(--rose-600); font-weight: 800; cursor: pointer; text-decoration: underline; font-family: inherit; }`,
})
export class LoginPage {
  readonly i18n = inject(I18n);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly needsConfirmation = signal(false);
  readonly resending = signal(false);

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.needsConfirmation.set(false);
    try {
      const { email, password } = this.form.getRawValue();
      const result = await this.auth.login(email.trim(), password);
      if (result.mustChangePassword) {
        await this.router.navigateByUrl('/change-password');
        return;
      }
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/app/dashboard');
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async resend(): Promise<void> {
    this.resending.set(true);
    try {
      await this.api.post('/auth/resend-confirmation', { email: this.form.getRawValue().email.trim() });
      this.toast.success(this.i18n.t('login.resent'));
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.resending.set(false);
    }
  }

  private showError(error: unknown): void {
    if (error instanceof ApiError) {
      let text = this.i18n.error(error);
      if (error.code === 'AccountLocked') {
        const until = (error.response?.data as { lockoutEndsAt?: string } | null)?.lockoutEndsAt;
        if (until) {
          text += ` (${this.i18n.t('login.until')} ${formatSaudi(until, this.i18n.lang(), 'time')})`;
        }
      }
      if (error.code === 'EmailNotConfirmed') {
        this.needsConfirmation.set(true);
      }
      this.error.set(text);
      return;
    }
    this.error.set(this.i18n.t('common.unexpectedError'));
  }
}

// ───────────────────────────── Register ─────────────────────────────
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent],
  template: `
    @if (done()) {
      <div class="center stack" style="align-items:center">
        <div class="seal">✓</div>
        <h1>{{ i18n.t('register.doneTitle') }}</h1>
        <p class="muted">{{ i18n.t('register.doneText', { email: doneEmail() }) }}</p>
        <a routerLink="/login" class="btn btn-primary">{{ i18n.t('nav.login') }}</a>
      </div>
    } @else {
      <h1 class="title">{{ i18n.t('register.title') }}</h1>
      <p class="muted mb-2">{{ i18n.t('register.subtitle') }}</p>

      @if (error()) {
        <div class="alert alert-error mb-2">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label>{{ i18n.t('register.chooseTrack') }}</label>
          <div class="tracks">
            @for (role of roles(); track role.id) {
              <button type="button" class="track" [class.on]="form.controls.roleId.value === role.id" (click)="form.controls.roleId.setValue(role.id)">
                <b>{{ i18n.name(role) }}</b>
                <small>{{ i18n.t('track.' + role.id) }}</small>
              </button>
            }
          </div>
          @if (form.controls.roleId.touched && !form.controls.roleId.value) {
            <span class="field-error">{{ i18n.t('val.required') }}</span>
          }
        </div>

        <div class="form-grid">
          <app-field [label]="i18n.t('f.firstNameAr')" [control]="form.controls.firstNameAr">
            <input class="input" formControlName="firstNameAr" [class.invalid]="bad('firstNameAr')" />
          </app-field>
          <app-field [label]="i18n.t('f.lastNameAr')" [control]="form.controls.lastNameAr">
            <input class="input" formControlName="lastNameAr" [class.invalid]="bad('lastNameAr')" />
          </app-field>
          <app-field [label]="i18n.t('f.firstNameEn')" [control]="form.controls.firstNameEn">
            <input class="input ltr" formControlName="firstNameEn" [class.invalid]="bad('firstNameEn')" />
          </app-field>
          <app-field [label]="i18n.t('f.lastNameEn')" [control]="form.controls.lastNameEn">
            <input class="input ltr" formControlName="lastNameEn" [class.invalid]="bad('lastNameEn')" />
          </app-field>
          <app-field class="span-2" [label]="i18n.t('f.email')" [control]="form.controls.email">
            <input class="input ltr" type="email" formControlName="email" [class.invalid]="bad('email')" />
          </app-field>
          <app-field [label]="i18n.t('f.phone')" [control]="form.controls.phoneNumber" [hint]="i18n.t('hint.phone')">
            <input class="input ltr" formControlName="phoneNumber" placeholder="05XXXXXXXX" [class.invalid]="bad('phoneNumber')" />
          </app-field>
          <app-field [label]="i18n.t('f.city')" [control]="form.controls.cityId">
            <select class="select" formControlName="cityId" [class.invalid]="bad('cityId')">
              <option [ngValue]="0">{{ i18n.t('common.choose') }}</option>
              @for (city of cities(); track city.id) {
                <option [ngValue]="city.id">{{ i18n.name(city) }}</option>
              }
            </select>
          </app-field>
          <app-field class="span-2" [label]="i18n.t('f.password')" [control]="form.controls.password" [hint]="i18n.t('hint.password')">
            <input class="input ltr" type="password" formControlName="password" autocomplete="new-password" [class.invalid]="bad('password')" />
          </app-field>
        </div>

        <button class="btn btn-primary btn-block mt-1" [disabled]="busy()">
          @if (busy()) { <span class="spinner"></span> } {{ i18n.t('register.submit') }}
        </button>
      </form>
      <p class="mt-3 center muted">{{ i18n.t('register.haveAccount') }} <a routerLink="/login" class="bold">{{ i18n.t('nav.login') }}</a></p>
    }
  `,
  styles: `
    .title { font-size: 2.2rem; margin-bottom: 0.3rem; }
    .tracks { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; }
    .track { text-align: start; border: 1.5px solid var(--line); border-radius: 14px; background: #fff; padding: 0.85rem 1rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.15rem; transition: 0.18s; font-family: inherit; }
    .track b { font-size: 1.05rem; color: var(--oud-900); }
    .track small { color: var(--muted); font-size: 0.78rem; line-height: 1.4; }
    .track:hover { border-color: var(--gold-400); }
    .track.on { border-color: var(--gold-500); background: #fff9e8; box-shadow: 0 0 0 4px rgba(201, 162, 74, 0.18); }
    .seal { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; font-size: 2.4rem; color: #fff; background: linear-gradient(135deg, var(--gold-400), var(--green)); box-shadow: var(--shadow); }
  `,
})
export class RegisterPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly roles = signal<Lookup[]>([]);
  readonly cities = signal<Lookup[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly done = signal(false);
  readonly doneEmail = signal('');

  readonly form = this.fb.group({
    roleId: [0, [Validators.min(1)]],
    firstNameAr: ['', [Validators.required, Validators.maxLength(50), noBlank, patternValidator(PATTERNS.arabicName, 'arabicName')]],
    lastNameAr: ['', [Validators.required, Validators.maxLength(50), noBlank, patternValidator(PATTERNS.arabicName, 'arabicName')]],
    firstNameEn: ['', [Validators.required, Validators.maxLength(50), noBlank, patternValidator(PATTERNS.englishName, 'englishName')]],
    lastNameEn: ['', [Validators.required, Validators.maxLength(50), noBlank, patternValidator(PATTERNS.englishName, 'englishName')]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber: ['', [Validators.required, patternValidator(PATTERNS.phone, 'phone')]],
    cityId: [0, [Validators.min(1)]],
    password: ['', [Validators.required, patternValidator(PATTERNS.password, 'password')]],
  });

  async ngOnInit(): Promise<void> {
    try {
      const [roles, cities] = await Promise.all([this.api.get<Lookup[]>('/auth/registration-roles'), this.api.get<Lookup[]>('/lookups/cities')]);
      this.roles.set(roles.data);
      this.cities.set(cities.data);
      if (roles.data.length > 0) {
        this.form.controls.roleId.setValue(roles.data[0].id);
      }
    } catch (error) {
      this.error.set(this.i18n.error(error));
    }
  }

  bad(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const value = this.form.getRawValue();
      await this.api.post('/auth/register', {
        ...value,
        email: value.email.trim(),
        firstNameAr: value.firstNameAr.trim(),
        lastNameAr: value.lastNameAr.trim(),
        firstNameEn: value.firstNameEn.trim(),
        lastNameEn: value.lastNameEn.trim(),
      });
      this.doneEmail.set(value.email.trim());
      this.done.set(true);
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.error.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}

// ───────────────────────────── Confirm email ─────────────────────────────
@Component({
  selector: 'app-confirm-email',
  imports: [RouterLink],
  template: `
    <div class="center stack" style="align-items:center">
      @switch (state()) {
        @case ('loading') {
          <div class="loading-block"><span class="spinner"></span></div>
          <p class="muted">{{ i18n.t('confirm.loading') }}</p>
        }
        @case ('ok') {
          <div class="seal ok">✓</div>
          <h1>{{ i18n.t('confirm.okTitle') }}</h1>
          <p class="muted">{{ i18n.t('confirm.okText') }}</p>
          <a routerLink="/login" class="btn btn-primary">{{ i18n.t('nav.login') }}</a>
        }
        @default {
          <div class="seal bad">!</div>
          <h1>{{ i18n.t('confirm.failTitle') }}</h1>
          <p class="muted">{{ message() }}</p>
          <a routerLink="/login" class="btn btn-ghost">{{ i18n.t('nav.login') }}</a>
        }
      }
    </div>
  `,
  styles: `.seal { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; font-size: 2.4rem; color: #fff; box-shadow: var(--shadow); } .ok { background: linear-gradient(135deg, var(--gold-400), var(--green)); } .bad { background: linear-gradient(135deg, var(--rose-500), var(--red)); }`,
})
export class ConfirmEmailPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'ok' | 'fail'>('loading');
  readonly message = signal('');

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.message.set(this.i18n.t('confirm.noToken'));
      this.state.set('fail');
      return;
    }
    try {
      await this.api.post('/auth/confirm-email', { token });
      this.state.set('ok');
    } catch (error) {
      this.message.set(this.i18n.error(error));
      this.state.set('fail');
    }
  }
}

// ───────────────────────────── Forgot password ─────────────────────────────
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent],
  template: `
    <h1 class="title">{{ i18n.t('forgot.title') }}</h1>
    <p class="muted mb-3">{{ i18n.t('forgot.subtitle') }}</p>
    @if (sent()) {
      <div class="alert alert-success mb-2">{{ i18n.t('forgot.sent') }}</div>
    }
    @if (error()) {
      <div class="alert alert-error mb-2">{{ error() }}</div>
    }
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-field [label]="i18n.t('f.email')" [control]="form.controls.email">
        <input class="input ltr" type="email" formControlName="email" />
      </app-field>
      <button class="btn btn-primary btn-block" [disabled]="busy()">
        @if (busy()) { <span class="spinner"></span> } {{ i18n.t('forgot.submit') }}
      </button>
    </form>
    <p class="mt-3 center"><a routerLink="/login" class="bold">{{ i18n.t('forgot.back') }}</a></p>
  `,
  styles: `.title { font-size: 2.2rem; margin-bottom: 0.3rem; }`,
})
export class ForgotPasswordPage {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/auth/forgot-password', { email: this.form.getRawValue().email.trim() });
      this.sent.set(true);
    } catch (error) {
      this.error.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}

// ───────────────────────────── Reset password ─────────────────────────────
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent],
  template: `
    <h1 class="title">{{ i18n.t('reset.title') }}</h1>
    <p class="muted mb-3">{{ i18n.t('reset.subtitle') }}</p>
    @if (error()) {
      <div class="alert alert-error mb-2">{{ error() }}</div>
    }
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-field [label]="i18n.t('f.newPassword')" [control]="form.controls.newPassword" [hint]="i18n.t('hint.password')">
        <input class="input ltr" type="password" formControlName="newPassword" autocomplete="new-password" />
      </app-field>
      <app-field [label]="i18n.t('f.confirmPassword')" [control]="form.controls.confirm">
        <input class="input ltr" type="password" formControlName="confirm" autocomplete="new-password" />
      </app-field>
      <button class="btn btn-primary btn-block" [disabled]="busy()">
        @if (busy()) { <span class="spinner"></span> } {{ i18n.t('reset.submit') }}
      </button>
    </form>
    <p class="mt-3 center"><a routerLink="/login" class="bold">{{ i18n.t('forgot.back') }}</a></p>
  `,
  styles: `.title { font-size: 2.2rem; margin-bottom: 0.3rem; }`,
})
export class ResetPasswordPage {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, patternValidator(PATTERNS.password, 'password')]],
      confirm: ['', [Validators.required]],
    },
    { validators: (group) => (group.get('newPassword')?.value === group.get('confirm')?.value ? null : { mismatch: true }) },
  );
  readonly busy = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.controls.newPassword.invalid) {
      return;
    }
    if (this.form.errors?.['mismatch']) {
      this.error.set(this.i18n.t('val.mismatch'));
      return;
    }
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set(this.i18n.t('confirm.noToken'));
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/auth/reset-password', { token, newPassword: this.form.getRawValue().newPassword });
      this.toast.success(this.i18n.t('reset.done'));
      await this.router.navigateByUrl('/login');
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.error.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}

// ───────────────────────────── Change password (form + forced page) ─────────────────────────────
@Component({
  selector: 'app-change-password-form',
  imports: [ReactiveFormsModule, FieldComponent],
  template: `
    @if (error()) {
      <div class="alert alert-error mb-2">{{ error() }}</div>
    }
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-field [label]="i18n.t('f.currentPassword')" [control]="form.controls.currentPassword">
        <input class="input ltr" type="password" formControlName="currentPassword" autocomplete="current-password" />
      </app-field>
      <app-field [label]="i18n.t('f.newPassword')" [control]="form.controls.newPassword" [hint]="i18n.t('hint.password')">
        <input class="input ltr" type="password" formControlName="newPassword" autocomplete="new-password" />
      </app-field>
      <app-field [label]="i18n.t('f.confirmPassword')" [control]="form.controls.confirmNewPassword">
        <input class="input ltr" type="password" formControlName="confirmNewPassword" autocomplete="new-password" />
      </app-field>
      <button class="btn btn-primary" [disabled]="busy()">
        @if (busy()) { <span class="spinner"></span> } {{ i18n.t('account.changePassword') }}
      </button>
    </form>
  `,
})
export class ChangePasswordForm {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly changed = output<void>();

  readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, patternValidator(PATTERNS.password, 'password')]],
    confirmNewPassword: ['', [Validators.required]],
  });
  readonly busy = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    if (value.newPassword !== value.confirmNewPassword) {
      this.form.controls.confirmNewPassword.setErrors({ mismatch: true });
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/auth/change-password', value);
      this.changed.emit();
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.error.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}

@Component({
  selector: 'app-change-password-page',
  imports: [ChangePasswordForm],
  template: `
    <h1 class="title">{{ i18n.t('forced.title') }}</h1>
    <p class="muted mb-3">{{ i18n.t('forced.subtitle') }}</p>
    <app-change-password-form (changed)="done()" />
  `,
  styles: `.title { font-size: 2.2rem; margin-bottom: 0.3rem; }`,
})
export class ChangePasswordPage {
  readonly i18n = inject(I18n);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  async done(): Promise<void> {
    this.auth.clear();
    this.toast.success(this.i18n.t('forced.done'));
    await this.router.navigateByUrl('/login');
  }
}
