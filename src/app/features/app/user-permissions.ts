import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { UserPermissions } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-user-permissions',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div>
        <a routerLink="/app/users" class="small bold">{{ i18n.isAr() ? '→' : '←' }} {{ i18n.t('menu.users') }}</a>
        <h1>{{ i18n.t('perm.title') }}</h1>
        @if (data(); as d) { <p>{{ i18n.t('perm.role') }}: <span class="badge b-gold">{{ i18n.name(d.role) }}</span></p> }
      </div>
      @if (data()?.isEditable) {
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> } {{ i18n.t('common.save') }}
        </button>
      }
    </div>

    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (data(); as d) {
      @if (!d.isEditable) { <div class="alert alert-info mb-2">{{ i18n.t('perm.readonly') }}</div> }
      <div class="grid grid-2">
        @for (module of d.modules; track module.id) {
          <section class="card">
            <h3>{{ i18n.name(module) }}</h3>
            <ul class="plist">
              @for (perm of module.permissions; track perm.id) {
                <li>
                  <label class="check">
                    <input type="checkbox" [checked]="checked().has(perm.id)" [disabled]="!d.isEditable" (change)="toggle(perm.id)" />
                    <span>{{ i18n.name(perm) }}</span>
                  </label>
                  <span class="badge" [class.b-green]="perm.source === 'Role'" [class.b-rose]="perm.source !== 'Role'">
                    {{ perm.source === 'Role' ? i18n.t('perm.fromRole') : i18n.t('perm.custom') }}
                  </span>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    }
  `,
  styles: `
    .plist { list-style: none; padding: 0; margin: 0.6rem 0 0; display: flex; flex-direction: column; }
    .plist li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px dashed var(--line); }
    .plist li:last-child { border: 0; }
  `,
})
export class UserPermissionsPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly data = signal<UserPermissions | null>(null);
  readonly checked = signal(new Set<number>());
  readonly loading = signal(true);
  readonly saving = signal(false);
  private readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  ngOnInit(): void {
    this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.api.get<UserPermissions>(`/users/${this.id()}/permissions`);
      this.data.set(response.data);
      const set = new Set<number>();
      for (const module of response.data.modules) {
        for (const permission of module.permissions) {
          if (permission.hasPermission) {
            set.add(permission.id);
          }
        }
      }
      this.checked.set(set);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  toggle(id: number): void {
    const next = new Set(this.checked());
    next.has(id) ? next.delete(id) : next.add(id);
    this.checked.set(next);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.api.put(`/users/${this.id()}/permissions`, { permissionIds: [...this.checked()] });
      this.toast.success(this.i18n.t('perm.saved'));
      await this.load();
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.saving.set(false);
    }
  }
}
