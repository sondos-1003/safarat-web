import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18n } from '../core/i18n.service';
import { LogoComponent } from '../shared/ui';
import { IconComponent } from './icon';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <header class="nav">
      <div class="container bar">
        <a routerLink="/" class="brand"><app-logo [light]="true" [size]="42" /></a>
        <nav class="links" [class.open]="menu()">
          <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }" (click)="menu.set(false)">{{ i18n.t('nav.home') }}</a>
          <a routerLink="/events" routerLinkActive="on" (click)="menu.set(false)">{{ i18n.t('nav.events') }}</a>
          <a routerLink="/community" routerLinkActive="on" (click)="menu.set(false)">{{ i18n.t('nav.community') }}</a>
          <a routerLink="/booking" routerLinkActive="on" (click)="menu.set(false)">{{ i18n.t('nav.myBooking') }}</a>
          <div class="mobile-actions">
            @if (auth.isLoggedIn()) {
              <a class="btn btn-primary btn-sm" routerLink="/app/dashboard">{{ i18n.t('nav.dashboard') }}</a>
            } @else {
              <a class="btn btn-light btn-sm" routerLink="/login">{{ i18n.t('nav.login') }}</a>
              <a class="btn btn-primary btn-sm" routerLink="/register">{{ i18n.t('nav.register') }}</a>
            }
          </div>
        </nav>
        <div class="actions">
          <button class="lang" (click)="i18n.toggle()" [title]="i18n.t('nav.switchLang')">
            <app-icon name="globe" [size]="17" /> {{ i18n.isAr() ? 'English' : 'العربية' }}
          </button>
          <span class="desktop-only row">
            @if (auth.isLoggedIn()) {
              <a class="btn btn-primary btn-sm" routerLink="/app/dashboard">{{ i18n.t('nav.dashboard') }}</a>
            } @else {
              <a class="btn btn-light btn-sm" routerLink="/login">{{ i18n.t('nav.login') }}</a>
              <a class="btn btn-primary btn-sm" routerLink="/register">{{ i18n.t('nav.register') }}</a>
            }
          </span>
          <button class="burger" (click)="menu.set(!menu())" aria-label="menu"><app-icon name="menu" [size]="24" /></button>
        </div>
      </div>
    </header>

    <main><router-outlet /></main>

    <footer class="foot pattern-bg">
      <div class="container cols">
        <div>
          <app-logo [light]="true" />
          <p class="about">{{ i18n.t('footer.about') }}</p>
        </div>
        <div>
          <h4>{{ i18n.t('footer.explore') }}</h4>
          <a routerLink="/events">{{ i18n.t('nav.events') }}</a>
          <a routerLink="/community">{{ i18n.t('nav.community') }}</a>
          <a routerLink="/booking">{{ i18n.t('nav.myBooking') }}</a>
        </div>
        <div>
          <h4>{{ i18n.t('footer.join') }}</h4>
          <a routerLink="/register">{{ i18n.t('nav.register') }}</a>
          <a routerLink="/login">{{ i18n.t('nav.login') }}</a>
        </div>
      </div>
      <div class="container copy">© 2026 {{ i18n.t('brand.name') }} — {{ i18n.t('footer.rights') }}</div>
    </footer>
  `,
  styles: `
    .nav { position: sticky; top: 0; z-index: 500; background: rgba(19, 10, 8, 0.88); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(201, 162, 74, 0.25); }
    .bar { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding-block: 0.7rem; }
    .brand { display: inline-flex; }
    .links { display: flex; gap: 0.4rem; margin-inline-start: auto; }
    .links > a { color: rgba(255, 255, 255, 0.82); font-weight: 700; padding: 0.5rem 0.95rem; border-radius: 999px; transition: 0.2s; }
    .links > a:hover, .links > a.on { color: var(--gold-300); background: rgba(201, 162, 74, 0.14); }
    .actions { display: flex; align-items: center; gap: 0.7rem; }
    .lang { display: inline-flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255, 255, 255, 0.28); color: #fff; border-radius: 999px; padding: 0.38rem 0.85rem; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
    .lang:hover { border-color: var(--gold-400); color: var(--gold-300); }
    .burger, .mobile-actions { display: none; }
    .burger { background: none; border: 0; color: #fff; cursor: pointer; }
    .foot { background-color: var(--oud-950); color: rgba(255, 255, 255, 0.72); padding-top: 3.5rem; margin-top: 0; }
    .cols { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 2.5rem; padding-bottom: 2.5rem; }
    .foot h4 { color: var(--gold-300); font-size: 1.15rem; }
    .foot a { display: block; color: rgba(255, 255, 255, 0.72); padding: 0.2rem 0; }
    .foot a:hover { color: var(--gold-300); }
    .about { margin-top: 1rem; max-width: 420px; font-size: 0.93rem; }
    .copy { border-top: 1px solid rgba(255, 255, 255, 0.1); padding-block: 1.2rem; font-size: 0.85rem; text-align: center; }
    @media (max-width: 860px) {
      .burger { display: inline-flex; }
      .desktop-only { display: none; }
      .links { position: absolute; inset-inline: 0; top: 100%; flex-direction: column; background: var(--oud-950); padding: 1rem 1.25rem; display: none; border-bottom: 1px solid rgba(201, 162, 74, 0.25); }
      .links.open { display: flex; }
      .mobile-actions { display: flex; gap: 0.6rem; padding-top: 0.6rem; }
      .cols { grid-template-columns: 1fr; }
    }
  `,
})
export class PublicLayout {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  readonly menu = signal(false);
}
