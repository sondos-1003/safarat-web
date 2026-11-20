import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18n } from '../core/i18n.service';
import { LogoComponent } from '../shared/ui';
import { IconComponent } from './icon';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, LogoComponent, IconComponent],
  template: `
    <div class="shell">
      <aside class="art">
        <div class="overlay pattern-bg"></div>
        <a routerLink="/" class="logo"><app-logo [light]="true" [size]="48" /></a>
        <div class="quote">
          <span class="gold-line"></span>
          <h2>{{ i18n.t('auth.heroTitle') }}</h2>
          <p>{{ i18n.t('auth.heroText') }}</p>
        </div>
      </aside>
      <section class="panel">
        <div class="top">
          <a routerLink="/" class="back">{{ i18n.isAr() ? '→' : '←' }} {{ i18n.t('auth.backHome') }}</a>
          <button class="lang" (click)="i18n.toggle()"><app-icon name="globe" [size]="16" /> {{ i18n.isAr() ? 'English' : 'العربية' }}</button>
        </div>
        <div class="content reveal"><router-outlet /></div>
      </section>
    </div>
  `,
  styles: `
    .shell { display: grid; grid-template-columns: 1.05fr 1fr; min-height: 100vh; }
    .art { position: relative; padding: 2.5rem; display: flex; flex-direction: column; justify-content: space-between; color: #fff; background: linear-gradient(180deg, rgba(19, 10, 8, 0.35), rgba(19, 10, 8, 0.82)), url('/images/hero-rose-farm.jpg') center / cover, url('/images/rose-valley.svg') center bottom / cover, var(--oud-900); overflow: hidden; }
    .overlay { position: absolute; inset: 0; opacity: 0.22; pointer-events: none; }
    .logo, .quote { position: relative; }
    .quote h2 { color: #fff; font-size: 2.4rem; margin-top: 1rem; }
    .quote p { color: rgba(255, 255, 255, 0.82); max-width: 460px; }
    .panel { background: var(--cream-50); display: flex; flex-direction: column; padding: 1.5rem 2rem 2.5rem; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .back { font-weight: 700; font-size: 0.92rem; }
    .lang { display: inline-flex; align-items: center; gap: 0.4rem; background: #fff; border: 1px solid var(--line); border-radius: 999px; padding: 0.35rem 0.85rem; cursor: pointer; font-weight: 700; font-size: 0.85rem; color: var(--oud-800); }
    .content { margin: auto; width: min(480px, 100%); padding-block: 2rem; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .art { display: none; }
    }
  `,
})
export class AuthLayout {
  readonly i18n = inject(I18n);
}
