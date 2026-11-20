import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { I18n } from '../../core/i18n.service';
import { Paged } from '../../core/models';
import { IconComponent } from '../../layout/icon';

interface Quick {
  route: string;
  icon: string;
  titleKey: string;
  textKey: string;
  permissions: string[];
}

const QUICK: Quick[] = [
  { route: '/app/browse', icon: 'compass', titleKey: 'menu.browse', textKey: 'dash.browse', permissions: ['Programs.Browse', 'Workshops.Browse'] },
  { route: '/app/enrollments', icon: 'clipboard', titleKey: 'menu.enrollments', textKey: 'dash.enrollments', permissions: ['Enrollments.ViewOwn'] },
  { route: '/app/my-sessions', icon: 'video', titleKey: 'menu.mySessions', textKey: 'dash.mySessions', permissions: ['Sessions.ViewOwn'] },
  { route: '/app/programs', icon: 'book', titleKey: 'menu.programs', textKey: 'dash.programs', permissions: ['Programs.View'] },
  { route: '/app/workshops', icon: 'flask', titleKey: 'menu.workshops', textKey: 'dash.workshops', permissions: ['Workshops.View'] },
  { route: '/app/events', icon: 'ticket', titleKey: 'menu.events', textKey: 'dash.events', permissions: ['Events.View', 'Events.Create', 'Events.CheckIn'] },
  { route: '/app/users', icon: 'users', titleKey: 'menu.users', textKey: 'dash.users', permissions: ['Users.View'] },
  { route: '/app/settings', icon: 'sliders', titleKey: 'menu.settings', textKey: 'dash.settings', permissions: ['Settings.View'] },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="welcome pattern-bg reveal">
      <div>
        <span class="eyebrow">{{ i18n.pick(auth.user()?.roleNameAr, auth.user()?.roleNameEn) }}</span>
        <h1>{{ i18n.t('dash.hello', { name: firstName() }) }}</h1>
        <p>{{ i18n.t('dash.subtitle') }}</p>
      </div>
      <div class="seal-art" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <g fill="none" stroke="#c9a24a" stroke-width="2"><rect x="26" y="26" width="68" height="68" /><rect x="26" y="26" width="68" height="68" transform="rotate(45 60 60)" /><circle cx="60" cy="60" r="20" /></g>
          <path d="M60 42c9 12 14 19 14 25a14 14 0 0 1-28 0c0-6 5-13 14-25z" fill="#c23b5a" />
        </svg>
      </div>
    </section>

    @if (stats().length > 0) {
      <div class="grid grid-4 mt-3">
        @for (stat of stats(); track stat.label) {
          <div class="card stat reveal d1">
            <span class="muted small">{{ i18n.t(stat.label) }}</span>
            <b>{{ stat.value }}</b>
          </div>
        }
      </div>
    }

    <h2 class="mt-4 mb-2">{{ i18n.t('dash.quick') }}</h2>
    <div class="grid grid-auto">
      @for (item of quick(); track item.route) {
        <a class="card card-hover quick" [routerLink]="item.route">
          <span class="ico"><app-icon [name]="item.icon" [size]="26" /></span>
          <div>
            <h3>{{ i18n.t(item.titleKey) }}</h3>
            <p>{{ i18n.t(item.textKey) }}</p>
          </div>
        </a>
      }
    </div>
  `,
  styles: `
    .welcome { background-color: var(--oud-950); color: #fff; border-radius: 26px; padding: 2.2rem 2.4rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; position: relative; overflow: hidden; }
    .welcome::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, var(--oud-950) 35%, rgba(19, 10, 8, 0.55)); }
    :host-context([dir='rtl']) .welcome::before { background: linear-gradient(260deg, var(--oud-950) 35%, rgba(19, 10, 8, 0.55)); }
    .welcome > * { position: relative; }
    .welcome h1 { color: #fff; font-size: 2.3rem; margin-bottom: 0.3rem; }
    .welcome p { margin: 0; color: rgba(255, 255, 255, 0.78); }
    .eyebrow { color: var(--gold-300); }
    .stat { display: flex; flex-direction: column; gap: 0.2rem; }
    .stat b { font-family: var(--font-display); font-size: 2.4rem; color: var(--rose-600); line-height: 1.1; }
    .quick { display: flex; gap: 1rem; color: var(--ink); align-items: flex-start; }
    .quick h3 { margin-bottom: 0.15rem; }
    .quick p { margin: 0; font-size: 0.88rem; color: var(--muted); }
    .ico { flex: none; width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(145deg, var(--gold-300), var(--gold-500)); color: var(--oud-950); }
    @media (max-width: 700px) { .seal-art { display: none; } .welcome { padding: 1.5rem; } }
  `,
})
export class DashboardPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly stats = signal<{ label: string; value: number }[]>([]);
  readonly quick = computed(() => QUICK.filter((item) => this.auth.can(...item.permissions)));
  readonly firstName = computed(() => {
    const user = this.auth.user();
    return user ? this.i18n.pick(user.firstNameAr, user.firstNameEn) : '';
  });

  async ngOnInit(): Promise<void> {
    const sources: { label: string; path: string; permission: string }[] = [
      { label: 'dash.stat.users', path: '/users', permission: 'Users.View' },
      { label: 'dash.stat.programs', path: '/programs', permission: 'Programs.View' },
      { label: 'dash.stat.workshops', path: '/workshops', permission: 'Workshops.View' },
    ];
    const results = await Promise.all(
      sources
        .filter((source) => this.auth.can(source.permission))
        .map(async (source) => {
          try {
            const response = await this.api.get<Paged<unknown>>(source.path, { pageNumber: 1, pageSize: 1 });
            return { label: source.label, value: response.data.totalCount };
          } catch {
            return null;
          }
        }),
    );
    this.stats.set(results.filter((item): item is { label: string; value: number } => item !== null));
  }
}
