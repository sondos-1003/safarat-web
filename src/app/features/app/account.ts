import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { I18n } from '../../core/i18n.service';
import { ToastService } from '../../core/toast.service';
import { ChangePasswordForm } from '../auth/auth-pages';

@Component({
  selector: 'app-account',
  imports: [ChangePasswordForm],
  template: `
    <div class="page-head"><div><h1>{{ i18n.t('account.title') }}</h1><p>{{ i18n.t('account.subtitle') }}</p></div></div>
    <div class="grid grid-2">
      <div class="card">
        <h3>{{ i18n.t('account.profile') }}</h3>
        @if (auth.user(); as user) {
          <dl class="kv">
            <dt>{{ i18n.t('f.fullNameAr') }}</dt><dd>{{ user.firstNameAr }} {{ user.lastNameAr }}</dd>
            <dt>{{ i18n.t('f.fullNameEn') }}</dt><dd class="ltr">{{ user.firstNameEn }} {{ user.lastNameEn }}</dd>
            <dt>{{ i18n.t('f.email') }}</dt><dd class="ltr">{{ user.email }}</dd>
            <dt>{{ i18n.t('f.role') }}</dt><dd><span class="badge b-gold">{{ i18n.pick(user.roleNameAr, user.roleNameEn) }}</span></dd>
          </dl>
        }
        <hr class="sep" />
        <p class="muted small">{{ i18n.t('account.logoutAllText') }}</p>
        <button class="btn btn-ghost" (click)="logoutAll()" [disabled]="busy()">{{ i18n.t('account.logoutAll') }}</button>
      </div>
      <div class="card">
        <h3>{{ i18n.t('account.changePassword') }}</h3>
        <app-change-password-form (changed)="changed()" />
      </div>
    </div>
  `,
  styles: `.sep { border: 0; border-top: 1px solid var(--line); margin: 1.4rem 0; }`,
})
export class AccountPage {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly busy = signal(false);

  async changed(): Promise<void> {
    this.auth.clear();
    this.toast.success(this.i18n.t('forced.done'));
    await this.router.navigateByUrl('/login');
  }

  async logoutAll(): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('account.logoutAll'),
      message: this.i18n.t('account.logoutAllConfirm'),
      confirmLabel: this.i18n.t('common.confirm'),
      cancelLabel: this.i18n.t('common.cancel'),
    });
    if (!ok) {
      return;
    }
    this.busy.set(true);
    try {
      await this.api.post('/auth/logout-all');
      this.auth.clear();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
