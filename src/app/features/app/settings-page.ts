import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { I18n } from '../../core/i18n.service';
import { SettingItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule],
  template: `
    <div class="page-head"><div><h1>{{ i18n.t('settings.title') }}</h1><p>{{ i18n.t('settings.subtitle') }}</p></div></div>
    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else {
      <div class="stack">
        @for (item of items(); track item.key) {
          <div class="card row between">
            <div class="grow">
              <b>{{ i18n.pick(item.nameAr, item.nameEn) }}</b>
              <div class="xs muted ltr">{{ item.key }}</div>
            </div>
            <input class="input val ltr" [ngModel]="values()[item.key]" (ngModelChange)="setValue(item.key, $event)" [disabled]="!auth.can('Settings.Edit')" />
            @if (auth.can('Settings.Edit')) {
              <button class="btn btn-primary btn-sm" (click)="save(item)" [disabled]="busyKey() === item.key || values()[item.key] === item.value">{{ i18n.t('common.save') }}</button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `.val { width: 160px; text-align: center; font-weight: 800; }`,
})
export class SettingsPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly items = signal<SettingItem[]>([]);
  readonly values = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly busyKey = signal('');

  ngOnInit(): void {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const response = await this.api.get<SettingItem[]>('/settings');
      this.items.set(response.data);
      this.values.set(Object.fromEntries(response.data.map((item) => [item.key, item.value])));
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  setValue(key: string, value: string): void {
    this.values.update((current) => ({ ...current, [key]: value }));
  }

  async save(item: SettingItem): Promise<void> {
    this.busyKey.set(item.key);
    try {
      await this.api.put(`/settings/${encodeURIComponent(item.key)}`, { value: String(this.values()[item.key]).trim() });
      this.toast.success(this.i18n.t('common.saved'));
      await this.load();
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busyKey.set('');
    }
  }
}
