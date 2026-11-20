import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { I18n } from '../../core/i18n.service';
import { EventBrowseItem, Paged } from '../../core/models';
import { EventCard } from './event-card';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, EventCard],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-pattern pattern-bg"></div>
      <div class="container hero-grid">
        <div class="hero-text">
          <span class="eyebrow reveal">{{ i18n.t('hero.eyebrow') }}</span>
          <h1 class="reveal d1">{{ i18n.t('hero.title') }}</h1>
          <p class="lead reveal d2">{{ i18n.t('hero.text') }}</p>
          <div class="row reveal d3">
            <a routerLink="/register" class="btn btn-primary">{{ i18n.t('hero.cta1') }}</a>
            <a routerLink="/events" class="btn btn-light">{{ i18n.t('hero.cta2') }}</a>
          </div>
          <div class="chips reveal d4">
            <span>{{ i18n.t('hero.chip1') }}</span>
            <span>{{ i18n.t('hero.chip2') }}</span>
            <span>{{ i18n.t('hero.chip3') }}</span>
          </div>
        </div>
        <div class="hero-art reveal d2" aria-hidden="true">
          <svg viewBox="0 0 360 460" class="bottle">
            <defs>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#f6e2a7" stop-opacity=".95" />
                <stop offset=".5" stop-color="#c9a24a" stop-opacity=".85" />
                <stop offset="1" stop-color="#7a5a1c" stop-opacity=".95" />
              </linearGradient>
              <linearGradient id="oil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#7a2236" />
                <stop offset="1" stop-color="#2a0c14" />
              </linearGradient>
              <radialGradient id="halo" cx=".5" cy=".5" r=".5">
                <stop offset="0" stop-color="#e8d097" stop-opacity=".45" />
                <stop offset="1" stop-color="#e8d097" stop-opacity="0" />
              </radialGradient>
            </defs>
            <circle cx="180" cy="250" r="190" fill="url(#halo)" />
            <g class="smoke" fill="none" stroke="#f3dfae" stroke-width="2.2" stroke-linecap="round" opacity=".55">
              <path d="M180 78c-22-24 22-40 0-66" />
              <path d="M158 90c-26-22 18-46-8-74" opacity=".6" />
              <path d="M204 90c24-26-16-44 10-72" opacity=".6" />
            </g>
            <path d="M156 104h48v26l14 14v18h-76v-18l14-14z" fill="url(#glass)" />
            <path d="M146 162h68c34 0 58 26 58 62v120c0 34-26 56-58 56h-68c-32 0-58-22-58-56V224c0-36 24-62 58-62z" fill="url(#glass)" stroke="#f6e2a7" stroke-width="2" />
            <path d="M152 186h56c24 0 42 20 42 46v106c0 26-18 42-42 42h-56c-24 0-42-16-42-42V232c0-26 18-46 42-46z" fill="url(#oil)" />
            <g fill="none" stroke="#e8d097" stroke-width="1.3" opacity=".75" transform="translate(180 290)">
              <rect x="-34" y="-34" width="68" height="68" />
              <rect x="-34" y="-34" width="68" height="68" transform="rotate(45)" />
              <circle r="11" />
            </g>
            <path d="M126 200c-6 40-6 90 0 130" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round" fill="none" />
            <rect x="160" y="92" width="40" height="14" rx="5" fill="#a8832f" />
            <circle cx="180" cy="82" r="13" fill="#e8d097" stroke="#a8832f" stroke-width="2" />
          </svg>
          <svg class="petal p1" viewBox="0 0 40 40"><path d="M20 2C32 12 36 26 20 38 4 26 8 12 20 2z" fill="#e9798f" /></svg>
          <svg class="petal p2" viewBox="0 0 40 40"><path d="M20 2C32 12 36 26 20 38 4 26 8 12 20 2z" fill="#f6b3c2" /></svg>
          <svg class="petal p3" viewBox="0 0 40 40"><path d="M20 2C32 12 36 26 20 38 4 26 8 12 20 2z" fill="#c23b5a" /></svg>
        </div>
      </div>
      <svg class="wave" viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0 40C240 90 480 0 720 30s480 60 720 10V80H0z" fill="#fdfaf3" /></svg>
    </section>

    <!-- Tracks -->
    <section class="section">
      <div class="container">
        <div class="head center">
          <span class="eyebrow">{{ i18n.t('tracks.eyebrow') }}</span>
          <h2>{{ i18n.t('tracks.title') }}</h2>
          <span class="gold-line"></span>
        </div>
        <div class="grid grid-3 mt-4">
          <article class="track card card-hover">
            <div class="num">١</div>
            <h3>{{ i18n.t('tracks.a.title') }}</h3>
            <p>{{ i18n.t('tracks.a.text') }}</p>
            <a routerLink="/register" class="more">{{ i18n.t('tracks.a.cta') }} {{ i18n.isAr() ? '←' : '→' }}</a>
          </article>
          <article class="track card card-hover">
            <div class="num">٢</div>
            <h3>{{ i18n.t('tracks.b.title') }}</h3>
            <p>{{ i18n.t('tracks.b.text') }}</p>
            <a routerLink="/register" class="more">{{ i18n.t('tracks.b.cta') }} {{ i18n.isAr() ? '←' : '→' }}</a>
          </article>
          <article class="track card card-hover">
            <div class="num">٣</div>
            <h3>{{ i18n.t('tracks.c.title') }}</h3>
            <p>{{ i18n.t('tracks.c.text') }}</p>
            <a routerLink="/events" class="more">{{ i18n.t('tracks.c.cta') }} {{ i18n.isAr() ? '←' : '→' }}</a>
          </article>
        </div>
      </div>
    </section>

    <!-- Land of roses -->
    <section class="section land">
      <div class="container land-grid">
        <div class="photos">
          <div class="photo big"></div>
          <div class="photo small"></div>
          <div class="seal-badge">
            <b>{{ i18n.t('land.badgeTop') }}</b>
            <span>{{ i18n.t('land.badgeBottom') }}</span>
          </div>
        </div>
        <div>
          <span class="eyebrow">{{ i18n.t('land.eyebrow') }}</span>
          <h2>{{ i18n.t('land.title') }}</h2>
          <p class="lead2">{{ i18n.t('land.text') }}</p>
          <ul class="ticks">
            <li>{{ i18n.t('land.p1') }}</li>
            <li>{{ i18n.t('land.p2') }}</li>
            <li>{{ i18n.t('land.p3') }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Journey -->
    <section class="section journey pattern-bg">
      <div class="container">
        <div class="head center light">
          <span class="eyebrow">{{ i18n.t('journey.eyebrow') }}</span>
          <h2>{{ i18n.t('journey.title') }}</h2>
          <span class="gold-line"></span>
        </div>
        <ol class="steps mt-4">
          @for (n of [1, 2, 3, 4]; track n) {
            <li>
              <span class="dot">{{ n }}</span>
              <h3>{{ i18n.t('journey.s' + n + '.t') }}</h3>
              <p>{{ i18n.t('journey.s' + n + '.d') }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- Upcoming events -->
    <section class="section">
      <div class="container">
        <div class="row between head-row">
          <div>
            <span class="eyebrow">{{ i18n.t('events.eyebrow') }}</span>
            <h2>{{ i18n.t('events.title') }}</h2>
          </div>
          <a routerLink="/events" class="btn btn-outline">{{ i18n.t('events.all') }}</a>
        </div>
        @if (loading()) {
          <div class="loading-block"><span class="spinner"></span></div>
        } @else if (events().length === 0) {
          <div class="card center muted">{{ i18n.t('events.none') }}</div>
        } @else {
          <div class="grid grid-auto mt-2">
            @for (event of events(); track event.id) {
              <app-event-card [event]="event" />
            }
          </div>
        }
      </div>
    </section>

    <!-- Community CTA -->
    <section class="cta">
      <div class="container cta-in">
        <div>
          <h2>{{ i18n.t('cta.title') }}</h2>
          <p>{{ i18n.t('cta.text') }}</p>
        </div>
        <a routerLink="/community" class="btn btn-primary">{{ i18n.t('cta.button') }}</a>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; color: #fff; min-height: min(92vh, 860px); display: flex; align-items: center; overflow: hidden;
      background: linear-gradient(100deg, rgba(19, 10, 8, 0.92) 8%, rgba(19, 10, 8, 0.55) 55%, rgba(60, 20, 34, 0.35)), url('/images/hero-rose-farm.jpg') center / cover, url('/images/rose-valley.svg') center bottom / cover, var(--oud-900); }
    :host-context([dir='rtl']) .hero { background: linear-gradient(260deg, rgba(19, 10, 8, 0.92) 8%, rgba(19, 10, 8, 0.55) 55%, rgba(60, 20, 34, 0.35)), url('/images/hero-rose-farm.jpg') center / cover, url('/images/rose-valley.svg') center bottom / cover, var(--oud-900); }
    .hero-pattern { position: absolute; inset: 0; opacity: 0.18; mask-image: linear-gradient(90deg, transparent, #000 60%); pointer-events: none; }
    .hero-grid { position: relative; display: grid; grid-template-columns: 1.15fr 0.85fr; align-items: center; gap: 2rem; padding-block: 5rem 7rem; }
    h1 { color: #fff; font-size: clamp(2.5rem, 5.6vw, 4.4rem); margin-bottom: 1rem; text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4); }
    .eyebrow { color: var(--gold-300); }
    .lead { font-size: 1.2rem; color: rgba(255, 255, 255, 0.86); max-width: 560px; margin-bottom: 1.8rem; }
    .chips { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 2rem; }
    .chips span { padding: 0.35rem 0.9rem; border: 1px solid rgba(232, 208, 151, 0.4); border-radius: 999px; font-size: 0.85rem; color: var(--gold-300); font-weight: 700; background: rgba(0, 0, 0, 0.18); }
    .hero-art { position: relative; display: flex; justify-content: center; }
    .bottle { width: min(360px, 80%); filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.5)); animation: float 6s ease-in-out infinite; }
    .smoke path { stroke-dasharray: 8 7; animation: drift 5s linear infinite; }
    .petal { position: absolute; width: 34px; opacity: 0.9; animation: fall 9s linear infinite; }
    .p1 { inset-inline-start: 8%; top: -6%; } .p2 { inset-inline-start: 74%; top: 4%; animation-delay: 2.5s; width: 26px; } .p3 { inset-inline-start: 42%; top: -10%; animation-delay: 5s; width: 30px; }
    @keyframes float { 50% { transform: translateY(-14px); } }
    @keyframes drift { to { stroke-dashoffset: -60; } }
    @keyframes fall { 0% { transform: translateY(0) rotate(0); opacity: 0; } 12% { opacity: 0.9; } 100% { transform: translateY(520px) rotate(260deg); opacity: 0; } }
    .wave { position: absolute; inset-block-end: -1px; inset-inline: 0; width: 100%; height: 70px; }

    .section { padding-block: 5rem; }
    .head { margin-bottom: 0.5rem; }
    .head-row { margin-bottom: 1rem; align-items: flex-end; }
    .track { position: relative; padding: 2rem 1.7rem; overflow: hidden; }
    .track::before { content: ''; position: absolute; inset-inline-end: -40px; inset-block-start: -40px; width: 140px; height: 140px; background: var(--pattern) center / 80px; opacity: 0.25; }
    .num { width: 54px; height: 54px; border-radius: 16px; display: grid; place-items: center; font-family: var(--font-display); font-size: 1.7rem; color: var(--gold-300); background: linear-gradient(145deg, var(--oud-700), var(--oud-950)); margin-bottom: 1rem; box-shadow: var(--shadow); }
    .track p { color: var(--muted); min-height: 5.2em; }
    .more { font-weight: 800; }

    .land { background: var(--cream-100); }
    .land-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .photos { position: relative; height: 480px; }
    .photo { position: absolute; border-radius: 26px; box-shadow: var(--shadow-lg); background-size: cover; background-position: center; border: 6px solid #fff; }
    .photo.big { inset-block: 0 70px; inset-inline-start: 0; width: 76%; background-image: url('/images/rose-farm-1.jpg'), url('/images/rose-valley.svg'); }
    .photo.small { inset-block-end: 0; inset-inline-end: 0; width: 52%; height: 52%; background-image: url('/images/rose-farm-2.jpg'), url('/images/rose-valley.svg'); background-position: 20% 70%; }
    .seal-badge { position: absolute; inset-block-start: 22px; inset-inline-end: 8%; width: 118px; height: 118px; border-radius: 50%; background: linear-gradient(145deg, var(--gold-400), var(--gold-600)); color: var(--oud-950); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-shadow: var(--shadow); border: 4px solid #fff; transform: rotate(-8deg); }
    .seal-badge b { font-family: var(--font-display); font-size: 1.25rem; line-height: 1.1; } .seal-badge span { font-size: 0.72rem; font-weight: 800; }
    .lead2 { color: var(--oud-700); font-size: 1.08rem; }
    .ticks { list-style: none; padding: 0; margin: 1.2rem 0 0; display: flex; flex-direction: column; gap: 0.7rem; }
    .ticks li { padding-inline-start: 2rem; position: relative; font-weight: 600; }
    .ticks li::before { content: '✦'; position: absolute; inset-inline-start: 0; color: var(--gold-500); font-size: 1.1rem; }

    .journey { background-color: var(--oud-950); color: #fff; }
    .journey h2 { color: #fff; }
    .journey .eyebrow { color: var(--gold-300); }
    .steps { list-style: none; padding: 0; margin-bottom: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; counter-reset: s; position: relative; }
    .steps li { position: relative; text-align: center; padding: 1.5rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(232, 208, 151, 0.22); border-radius: 20px; backdrop-filter: blur(4px); }
    .steps h3 { color: var(--gold-300); font-size: 1.2rem; }
    .steps p { margin: 0; font-size: 0.92rem; color: rgba(255, 255, 255, 0.75); }
    .dot { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; margin: -2.6rem auto 0.9rem; background: linear-gradient(135deg, var(--gold-400), var(--rose-500)); font-weight: 800; color: #fff; font-family: var(--font-display); font-size: 1.3rem; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4); }
    .steps { padding-top: 1.6rem; }

    .cta { background: linear-gradient(120deg, var(--rose-700), var(--oud-800)); color: #fff; padding-block: 3.2rem; position: relative; overflow: hidden; }
    .cta::before { content: ''; position: absolute; inset: 0; background: var(--pattern) center / 120px; opacity: 0.16; }
    .cta-in { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
    .cta h2 { color: #fff; margin-bottom: 0.3rem; }
    .cta p { margin: 0; color: rgba(255, 255, 255, 0.85); max-width: 620px; }

    @media (max-width: 960px) {
      .hero-grid { grid-template-columns: 1fr; padding-block: 3.5rem 6rem; }
      .hero-art { display: none; }
      .land-grid { grid-template-columns: 1fr; gap: 2.5rem; }
      .photos { height: 380px; }
      .steps { grid-template-columns: repeat(2, 1fr); gap: 2.4rem 1rem; }
    }
    @media (max-width: 560px) { .steps { grid-template-columns: 1fr; } }
  `,
})
export class LandingPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  readonly events = signal<EventBrowseItem[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const response = await this.api.get<Paged<EventBrowseItem>>('/events/browse', { pageNumber: 1, pageSize: 3 });
      this.events.set(response.data.items);
    } catch {
      this.events.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
