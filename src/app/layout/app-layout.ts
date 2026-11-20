import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18n } from '../core/i18n.service';
import { LogoComponent } from '../shared/ui';
import { IconComponent } from './icon';

interface MenuItem {
  route: string;
  labelKey: string;
  icon: string;
  permissions: string[];
}

interface MenuGroup {
  titleKey: string;
  items: MenuItem[];
}

const MENU: MenuGroup[] = [
  {
    titleKey: 'menu.learn',
    items: [
      { route: '/app/browse', labelKey: 'menu.browse', icon: 'compass', permissions: ['Programs.Browse', 'Workshops.Browse'] },
      { route: '/app/enrollments', labelKey: 'menu.enrollments', icon: 'clipboard', permissions: ['Enrollments.ViewOwn'] },
    ],
  },
  {
    titleKey: 'menu.teach',
    items: [{ route: '/app/my-sessions', labelKey: 'menu.mySessions', icon: 'video', permissions: ['Sessions.ViewOwn'] }],
  },
  {
    titleKey: 'menu.manage',
    items: [
      { route: '/app/programs', labelKey: 'menu.programs', icon: 'book', permissions: ['Programs.View'] },
      { route: '/app/workshops', labelKey: 'menu.workshops', icon: 'flask', permissions: ['Workshops.View'] },
      { route: '/app/events', labelKey: 'menu.events', icon: 'ticket', permissions: ['Events.View', 'Events.Create', 'Events.Edit', 'Events.Publish', 'Events.CheckIn'] },
      { route: '/app/users', labelKey: 'menu.users', icon: 'users', permissions: ['Users.View'] },
      { route: '/app/settings', labelKey: 'menu.settings', icon: 'sliders', permissions: ['Settings.View'] },
    ],
  },
];

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <div class="app" [class.nav-open]="open()">
      <aside class="side pattern-bg">
        <a routerLink="/" class="side-logo"><app-logo [light]="true" [size]="40" /></a>
        <nav>
          <a class="item" routerLink="/app/dashboard" routerLinkActive="on" (click)="open.set(false)">
            <app-icon name="home" /> {{ i18n.t('menu.dashboard') }}
          </a>
          @for (group of groups(); track group.titleKey) {
            <div class="group-title">{{ i18n.t(group.titleKey) }}</div>
            @for (item of group.items; track item.route) {
              <a class="item" [routerLink]="item.route" routerLinkActive="on" (click)="open.set(false)">
                <app-icon [name]="item.icon" /> {{ i18n.t(item.labelKey) }}
              </a>
            }
          }
        </nav>
        <div class="side-foot">
          <a class="item" routerLink="/app/account" routerLinkActive="on" (click)="open.set(false)"><app-icon name="shield" /> {{ i18n.t('menu.account') }}</a>
          <button class="item" (click)="logout()"><app-icon name="logout" /> {{ i18n.t('menu.logout') }}</button>
        </div>
      </aside>
      <div class="scrim" (click)="open.set(false)"></div>

      <div class="main">
        <header class="top">
          <button class="burger" (click)="open.set(true)" aria-label="menu"><app-icon name="menu" [size]="24" /></button>
          <div class="grow"></div>
          <button class="lang" (click)="i18n.toggle()"><app-icon name="globe" [size]="16" /> {{ i18n.isAr() ? 'English' : 'العربية' }}</button>
          <div class="me">
            <span class="avatar">{{ initial() }}</span>
            <span class="who">
              <b>{{ fullName() }}</b>
              <small>{{ i18n.pick(auth.user()?.roleNameAr, auth.user()?.roleNameEn) }}</small>
            </span>
          </div>
        </header>
        <div class="page"><router-outlet /></div>
      </div>
    </div>
  `,
  styles: `
    .app { display: grid; grid-template-columns: 268px 1fr; min-height: 100vh; background: var(--cream-100); }
    .side { background-color: var(--oud-950); color: #fff; display: flex; flex-direction: column; padding: 1.25rem 0.9rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .side-logo { display: inline-flex; padding: 0.25rem 0.6rem 1.25rem; }
    nav { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
    .group-title { font-size: 0.72rem; letter-spacing: 0.12em; color: var(--gold-500); font-weight: 800; padding: 1.1rem 0.8rem 0.35rem; text-transform: uppercase; }
    .item { display: flex; align-items: center; gap: 0.75rem; padding: 0.68rem 0.85rem; border-radius: 12px; color: rgba(255, 255, 255, 0.78); font-weight: 700; font-size: 0.95rem; background: none; border: 0; cursor: pointer; width: 100%; text-align: start; transition: 0.18s; }
    .item:hover { background: rgba(255, 255, 255, 0.07); color: #fff; }
    .item.on { background: linear-gradient(135deg, rgba(201, 162, 74, 0.28), rgba(201, 162, 74, 0.1)); color: var(--gold-300); box-shadow: inset 3px 0 0 var(--gold-500); }
    :host-context([dir='rtl']) .item.on { box-shadow: inset -3px 0 0 var(--gold-500); }
    .side-foot { border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 0.75rem; margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
    .main { min-width: 0; display: flex; flex-direction: column; }
    .top { display: flex; align-items: center; gap: 0.9rem; padding: 0.8rem 1.75rem; background: rgba(253, 250, 243, 0.85); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 50; }
    .burger { display: none; background: none; border: 0; cursor: pointer; color: var(--oud-800); }
    .lang { display: inline-flex; align-items: center; gap: 0.4rem; background: #fff; border: 1px solid var(--line); border-radius: 999px; padding: 0.35rem 0.85rem; cursor: pointer; font-weight: 700; font-size: 0.85rem; color: var(--oud-800); }
    .me { display: flex; align-items: center; gap: 0.65rem; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--gold-400), var(--rose-500)); color: #fff; font-weight: 800; font-family: var(--font-display); font-size: 1.2rem; }
    .who { display: flex; flex-direction: column; line-height: 1.2; }
    .who small { color: var(--muted); font-size: 0.75rem; }
    .page { padding: 1.75rem; width: 100%; max-width: 1280px; margin-inline: auto; }
    .scrim { display: none; }
    @media (max-width: 980px) {
      .app { grid-template-columns: 1fr; }
      .side { position: fixed; inset-block: 0; inset-inline-start: 0; width: 280px; z-index: 800; transform: translateX(-105%); transition: transform 0.3s; }
      :host-context([dir='rtl']) .side { transform: translateX(105%); }
      .nav-open .side { transform: none !important; }
      .nav-open .scrim { display: block; position: fixed; inset: 0; background: rgba(19, 10, 8, 0.55); z-index: 700; }
      .burger { display: inline-flex; }
      .who { display: none; }
      .page { padding: 1.1rem; }
      .top { padding-inline: 1rem; }
    }
  `,
})
export class AppLayout {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly open = signal(false);

  readonly groups = computed(() =>
    MENU.map((group) => ({ ...group, items: group.items.filter((item) => this.auth.can(...item.permissions)) })).filter((group) => group.items.length > 0),
  );

  readonly fullName = computed(() => {
    const user = this.auth.user();
    if (!user) {
      return '';
    }
    return this.i18n.isAr() ? `${user.firstNameAr} ${user.lastNameAr}` : `${user.firstNameEn} ${user.lastNameEn}`;
  });

  readonly initial = computed(() => (this.fullName().trim()[0] ?? '?').toUpperCase());

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}
