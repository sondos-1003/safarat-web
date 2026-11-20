import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { dayParts } from '../../core/date';
import { I18n } from '../../core/i18n.service';
import { EventBrowseItem } from '../../core/models';
import { IconComponent } from '../../layout/icon';
import { HijriPipe, SaudiDatePipe } from '../../shared/ui';

@Component({
  selector: 'app-event-card',
  imports: [RouterLink, IconComponent, SaudiDatePipe, HijriPipe],
  template: `
    <a class="ev card-hover" [routerLink]="['/events', event().id]">
      <div class="date">
        <b>{{ parts().day }}</b>
        <span>{{ parts().month }}</span>
      </div>
      <div class="info">
        <h3>{{ i18n.pick(event().titleAr, event().titleEn) }}</h3>
        <p class="desc">{{ i18n.pick(event().descriptionAr, event().descriptionEn) }}</p>
        <ul>
          <li><app-icon name="clock" [size]="16" /> {{ event().startsAt | sdate: 'time' }} · {{ event().startsAt | hijri }}</li>
          <li><app-icon name="pin" [size]="16" /> {{ i18n.pick(event().cityNameAr, event().cityNameEn) }} — {{ event().location }}</li>
          @if (event().speakers) {
            <li><app-icon name="user" [size]="16" /> {{ event().speakers }}</li>
          }
        </ul>
        <div class="foot">
          @if (event().isFull) {
            <span class="badge b-red">{{ i18n.t('event.full') }}</span>
          } @else {
            <span class="badge b-green">{{ i18n.t('event.seatsLeft', { n: event().remainingSeats }) }}</span>
          }
          <span class="go">{{ i18n.t('event.details') }} {{ i18n.isAr() ? '←' : '→' }}</span>
        </div>
      </div>
    </a>
  `,
  styles: `
    .ev { display: flex; gap: 1.1rem; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 1.2rem; color: var(--ink); height: 100%; position: relative; overflow: hidden; }
    .ev::after { content: ''; position: absolute; inset-block-start: 0; inset-inline-end: 0; width: 120px; height: 120px; background: var(--pattern) center / 70px; opacity: 0.2; mask-image: radial-gradient(circle at top right, #000, transparent 70%); }
    .date { flex: none; width: 74px; height: 86px; border-radius: 16px; background: linear-gradient(160deg, var(--oud-800), var(--oud-950)); color: var(--gold-300); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: var(--shadow); }
    .date b { font-family: var(--font-display); font-size: 2.1rem; line-height: 1; }
    .date span { font-size: 0.82rem; font-weight: 700; margin-top: 0.25rem; }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    h3 { margin-bottom: 0.3rem; color: var(--oud-900); }
    .desc { color: var(--muted); font-size: 0.9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.6rem; }
    ul { list-style: none; padding: 0; margin: 0 0 0.9rem; display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.86rem; color: var(--oud-700); }
    li { display: flex; align-items: center; gap: 0.45rem; }
    li app-icon { color: var(--gold-600); }
    .foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
    .go { font-weight: 800; color: var(--rose-600); font-size: 0.9rem; }
  `,
})
export class EventCard {
  readonly i18n = inject(I18n);
  readonly event = input.required<EventBrowseItem>();
  readonly parts = computed(() => dayParts(this.event().startsAt, this.i18n.lang()));
}
