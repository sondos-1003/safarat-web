import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { PATTERNS, applyServerErrors, noBlank, patternValidator } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { EventBookingConfirmation, EventBrowseItem, EventDetails, Paged } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../layout/icon';
import { EmptyComponent, FieldComponent, HijriPipe, SaudiDatePipe, StarsComponent } from '../../shared/ui';
import { EventCard } from './event-card';

@Component({
  selector: 'app-banner',
  template: `
    <section class="banner pattern-bg">
      <div class="container">
        <span class="eyebrow">{{ eyebrow() }}</span>
        <h1>{{ title() }}</h1>
        @if (text()) { <p>{{ text() }}</p> }
      </div>
    </section>
  `,
  styles: `
    .banner { background-color: var(--oud-950); color: #fff; padding-block: 3.2rem 3.5rem; position: relative; }
    .banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, var(--oud-950) 30%, rgba(19, 10, 8, 0.4)); }
    :host-context([dir='rtl']) .banner::after { background: linear-gradient(270deg, var(--oud-950) 30%, rgba(19, 10, 8, 0.4)); }
    .container { position: relative; z-index: 1; }
    h1 { color: #fff; font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 0.4rem; }
    p { margin: 0; color: rgba(255, 255, 255, 0.78); max-width: 640px; }
    .eyebrow { color: var(--gold-300); }
  `,
})
export class Banner {
  readonly eyebrow = input('');
  readonly title = input('');
  readonly text = input('');
}

// ───────────────────────────── Events list ─────────────────────────────
@Component({
  selector: 'app-events-page',
  imports: [Banner, EventCard, EmptyComponent],
  template: `
    <app-banner [eyebrow]="i18n.t('events.eyebrow')" [title]="i18n.t('events.pageTitle')" [text]="i18n.t('events.pageText')" />
    <div class="container body">
      @if (loading()) {
        <div class="loading-block"><span class="spinner"></span></div>
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else if (items().length === 0) {
        <app-empty [text]="i18n.t('events.none')" />
      } @else {
        <div class="grid grid-auto">
          @for (event of items(); track event.id) {
            <app-event-card [event]="event" />
          }
        </div>
        @if (totalPages() > 1) {
          <div class="row center mt-3">
            <button class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="load(page() - 1)">{{ i18n.t('common.prev') }}</button>
            <span class="muted small">{{ i18n.t('common.pageOf', { page: page(), total: totalPages() }) }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="load(page() + 1)">{{ i18n.t('common.next') }}</button>
          </div>
        }
      }
    </div>
  `,
  styles: `.body { padding-block: 3rem 4rem; min-height: 50vh; } .grid-auto { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); } @media (max-width: 480px) { .grid-auto { grid-template-columns: 1fr; } }`,
})
export class EventsPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  readonly items = signal<EventBrowseItem[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await this.api.get<Paged<EventBrowseItem>>('/events/browse', { pageNumber: page, pageSize: 9 });
      this.items.set(response.data.items);
      this.page.set(response.data.pageNumber);
      this.totalPages.set(response.data.totalPages);
    } catch (error) {
      this.error.set(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }
}

// ───────────────────────────── Event details + booking ─────────────────────────────
@Component({
  selector: 'app-event-detail-page',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent, SaudiDatePipe, HijriPipe],
  template: `
    @if (loading()) {
      <div class="loading-block" style="min-height:60vh"><span class="spinner"></span></div>
    } @else if (!event()) {
      <div class="container" style="padding-block:5rem">
        <div class="alert alert-error">{{ error() }}</div>
        <a routerLink="/events" class="btn btn-ghost mt-2">{{ i18n.t('events.back') }}</a>
      </div>
    } @else {
      @let ev = event()!;
      <section class="top pattern-bg">
        <div class="container">
          <a routerLink="/events" class="back">{{ i18n.isAr() ? '→' : '←' }} {{ i18n.t('events.back') }}</a>
          <h1>{{ i18n.pick(ev.titleAr, ev.titleEn) }}</h1>
          <div class="meta">
            <span><app-icon name="calendar" [size]="18" /> {{ ev.startsAt | sdate: 'date' }} · {{ ev.startsAt | hijri }}</span>
            <span><app-icon name="clock" [size]="18" /> {{ ev.startsAt | sdate: 'time' }} — {{ ev.endsAt | sdate: 'time' }}</span>
            <span><app-icon name="pin" [size]="18" /> {{ i18n.name(ev.city) }} — {{ ev.location }}</span>
          </div>
        </div>
      </section>

      <div class="container layout">
        <article class="card about">
          <h2>{{ i18n.t('event.about') }}</h2>
          <p class="desc">{{ i18n.pick(ev.descriptionAr, ev.descriptionEn) }}</p>
          @if (ev.speakers) {
            <h3 class="mt-3">{{ i18n.t('event.speakers') }}</h3>
            <p>{{ ev.speakers }}</p>
          }
        </article>

        <aside class="card book">
          @if (confirmation(); as c) {
            <div class="center stack" style="align-items:center">
              <div class="seal">✓</div>
              <h3>{{ i18n.t('book.doneTitle') }}</h3>
              <p class="muted small">{{ i18n.t('book.doneText') }}</p>
              <div class="code" (click)="copy(c.bookingCode)" [title]="i18n.t('book.copy')">{{ c.bookingCode }}</div>
              <span class="xs muted">{{ i18n.t('book.seatsBooked', { n: c.totalSeatsBooked }) }}</span>
              <a routerLink="/booking" class="btn btn-outline btn-sm">{{ i18n.t('nav.myBooking') }}</a>
            </div>
          } @else if (ev.status.id !== 2) {
            <div class="alert alert-warn">{{ ev.status.id === 3 ? i18n.t('event.cancelled') : i18n.t('event.notPublished') }}</div>
          } @else if (ev.remainingSeats <= 0) {
            <div class="alert alert-error">{{ i18n.t('event.full') }}</div>
          } @else {
            <h3>{{ i18n.t('book.title') }}</h3>
            <div class="seats">
              <div class="progress"><span [style.width.%]="(ev.bookedSeats / ev.seats) * 100"></span></div>
              <span class="xs muted">{{ i18n.t('event.seatsLeft', { n: ev.remainingSeats }) }}</span>
            </div>
            @if (error()) { <div class="alert alert-error mb-2">{{ error() }}</div> }
            <form [formGroup]="form" (ngSubmit)="submit(ev.id)" novalidate>
              <app-field [label]="i18n.t('f.fullName')" [control]="form.controls.fullName">
                <input class="input" formControlName="fullName" />
              </app-field>
              <app-field [label]="i18n.t('f.phone')" [control]="form.controls.phoneNumber" [hint]="i18n.t('hint.phone')">
                <input class="input ltr" formControlName="phoneNumber" placeholder="05XXXXXXXX" />
              </app-field>
              <app-field [label]="i18n.t('f.email')" [control]="form.controls.email">
                <input class="input ltr" type="email" formControlName="email" />
              </app-field>
              <app-field [label]="i18n.t('f.companions')" [control]="form.controls.companionsCount" [hint]="i18n.t('hint.companions')">
                <select class="select" formControlName="companionsCount">
                  @for (n of [0, 1, 2, 3]; track n) { <option [ngValue]="n">{{ n }}</option> }
                </select>
              </app-field>
              <button class="btn btn-primary btn-block" [disabled]="busy()">
                @if (busy()) { <span class="spinner"></span> } {{ i18n.t('book.submit') }}
              </button>
            </form>
          }
        </aside>
      </div>
    }
  `,
  styles: `
    .top { background-color: var(--oud-950); color: #fff; padding-block: 2.2rem 5rem; position: relative; }
    .top::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(19, 10, 8, 0.5), var(--oud-950)); }
    .top .container { position: relative; z-index: 1; }
    .back { color: var(--gold-300); font-weight: 700; font-size: 0.9rem; }
    h1 { color: #fff; margin: 0.9rem 0; }
    .meta { display: flex; gap: 1.5rem; flex-wrap: wrap; color: rgba(255, 255, 255, 0.85); font-weight: 600; }
    .meta span { display: inline-flex; align-items: center; gap: 0.5rem; }
    .meta app-icon { color: var(--gold-400); }
    .layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.75rem; margin-top: -3rem; position: relative; z-index: 2; padding-bottom: 4rem; align-items: start; }
    .desc { white-space: pre-line; font-size: 1.05rem; }
    .book { position: sticky; top: 90px; box-shadow: var(--shadow); }
    .seats { margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .seal { width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; font-size: 2.2rem; color: #fff; background: linear-gradient(135deg, var(--gold-400), var(--green)); }
    .code { font-family: 'Courier New', monospace; font-size: 1.7rem; font-weight: 800; letter-spacing: 0.12em; padding: 0.7rem 1.4rem; border: 2px dashed var(--gold-500); border-radius: 14px; background: #fff9e8; cursor: pointer; color: var(--oud-900); direction: ltr; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .book { position: static; } }
  `,
})
export class EventDetailPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly event = signal<EventDetails | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly confirmation = signal<EventBookingConfirmation | null>(null);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100), noBlank]],
    phoneNumber: ['', [Validators.required, patternValidator(PATTERNS.phone, 'phone')]],
    email: ['', [Validators.required, Validators.email]],
    companionsCount: [0, [Validators.min(0), Validators.max(3)]],
  });

  async ngOnInit(): Promise<void> {
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      const response = await this.api.get<EventDetails>(`/events/${id}`);
      this.event.set(response.data);
    } catch (error) {
      this.error.set(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  async submit(id: number): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const value = this.form.getRawValue();
      const response = await this.api.post<EventBookingConfirmation>(`/events/${id}/register`, {
        ...value,
        fullName: value.fullName.trim(),
        email: value.email.trim(),
      });
      this.confirmation.set(response.data);
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.error.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async copy(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.toast.success(this.i18n.t('book.copied'));
    } catch {
      this.toast.info(code);
    }
  }
}

// ───────────────────────────── Manage booking (cancel / survey) ─────────────────────────────
@Component({
  selector: 'app-booking-page',
  imports: [FormsModule, Banner, StarsComponent],
  template: `
    <app-banner [eyebrow]="i18n.t('nav.myBooking')" [title]="i18n.t('booking.title')" [text]="i18n.t('booking.text')" />
    <div class="container body">
      <div class="card codebox">
        <label class="bold">{{ i18n.t('booking.code') }}</label>
        <input class="input ltr code" [(ngModel)]="code" placeholder="XXXXXXXX" />
      </div>
      <div class="grid grid-2 mt-3">
        <div class="card">
          <h3>{{ i18n.t('booking.rateTitle') }}</h3>
          <p class="muted small">{{ i18n.t('booking.rateText') }}</p>
          <app-stars [(value)]="rating" [editable]="true" [size]="34" />
          <div class="field mt-2">
            <textarea class="textarea" [(ngModel)]="feedback" [placeholder]="i18n.t('booking.feedback')"></textarea>
          </div>
          <button class="btn btn-primary" [disabled]="!code().trim() || rating() < 1 || busy()" (click)="survey()">{{ i18n.t('booking.sendRating') }}</button>
        </div>
        <div class="card">
          <h3>{{ i18n.t('booking.cancelTitle') }}</h3>
          <p class="muted small">{{ i18n.t('booking.cancelText') }}</p>
          <button class="btn btn-danger" [disabled]="!code().trim() || busy()" (click)="cancel()">{{ i18n.t('booking.cancelBtn') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: `.body { padding-block: 2.5rem 4rem; min-height: 50vh; } .codebox { max-width: 520px; } .code { font-size: 1.3rem; letter-spacing: 0.1em; font-weight: 800; margin-top: 0.5rem; text-transform: uppercase; }`,
})
export class BookingPage {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly code = signal('');
  readonly rating = signal(0);
  readonly feedback = signal('');
  readonly busy = signal(false);

  async cancel(): Promise<void> {
    await this.run(() => this.api.post(`/events/bookings/${encodeURIComponent(this.code().trim())}/cancel`));
  }

  async survey(): Promise<void> {
    await this.run(() =>
      this.api.post(`/events/bookings/${encodeURIComponent(this.code().trim())}/survey`, {
        rating: this.rating(),
        feedback: this.feedback().trim() || null,
      }),
    );
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.i18n.t('common.done'));
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}

// ───────────────────────────── Community ─────────────────────────────
const INTERESTS = [
  ['oud', 'العود', 'Oud'],
  ['bakhoor', 'البخور', 'Bakhoor'],
  ['rose', 'الورد الطائفي', 'Taif rose'],
  ['amber', 'العنبر', 'Amber'],
  ['musk', 'المسك', 'Musk'],
  ['attar', 'الدهن والعطور الزيتية', 'Attars & oils'],
  ['blending', 'فن المزج', 'Blending'],
  ['heritage', 'تراث الطيب', 'Fragrance heritage'],
] as const;

@Component({
  selector: 'app-community-page',
  imports: [ReactiveFormsModule, Banner, FieldComponent],
  template: `
    <app-banner [eyebrow]="i18n.t('nav.community')" [title]="i18n.t('community.title')" [text]="i18n.t('community.text')" />
    <div class="container body">
      @if (done()) {
        <div class="card center stack" style="align-items:center;padding:3rem">
          <div class="seal">✓</div>
          <h2>{{ i18n.t('community.doneTitle') }}</h2>
          <p class="muted">{{ i18n.t('community.doneText') }}</p>
        </div>
      } @else {
        <div class="grid two">
          <div class="perks">
            <h2>{{ i18n.t('community.why') }}</h2>
            <span class="gold-line"></span>
            <ul>
              <li><b>{{ i18n.t('community.p1t') }}</b><span>{{ i18n.t('community.p1d') }}</span></li>
              <li><b>{{ i18n.t('community.p2t') }}</b><span>{{ i18n.t('community.p2d') }}</span></li>
              <li><b>{{ i18n.t('community.p3t') }}</b><span>{{ i18n.t('community.p3d') }}</span></li>
            </ul>
          </div>
          <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (error()) { <div class="alert alert-error mb-2">{{ error() }}</div> }
            <app-field [label]="i18n.t('f.fullName')" [control]="form.controls.fullName"><input class="input" formControlName="fullName" /></app-field>
            <div class="form-grid">
              <app-field [label]="i18n.t('f.phone')" [control]="form.controls.phoneNumber"><input class="input ltr" formControlName="phoneNumber" placeholder="05XXXXXXXX" /></app-field>
              <app-field [label]="i18n.t('f.email')" [control]="form.controls.email"><input class="input ltr" type="email" formControlName="email" /></app-field>
            </div>
            <div class="field">
              <label>{{ i18n.t('community.interests') }}</label>
              <div class="chips">
                @for (item of interests; track item[0]) {
                  <button type="button" class="chip" [class.on]="selected().has(item[0])" (click)="toggle(item[0])">{{ i18n.isAr() ? item[1] : item[2] }}</button>
                }
              </div>
              @if (touched() && selected().size === 0) { <span class="field-error">{{ i18n.t('community.pickOne') }}</span> }
            </div>
            <button class="btn btn-rose btn-block" [disabled]="busy()">
              @if (busy()) { <span class="spinner"></span> } {{ i18n.t('community.join') }}
            </button>
          </form>
        </div>
      }
    </div>
  `,
  styles: `
    .body { padding-block: 3rem 4rem; }
    .two { grid-template-columns: 1fr 1.1fr; gap: 3rem; align-items: start; }
    .perks ul { list-style: none; padding: 0; margin: 1.5rem 0 0; display: flex; flex-direction: column; gap: 1.1rem; }
    .perks li { display: flex; flex-direction: column; padding-inline-start: 1.2rem; border-inline-start: 3px solid var(--gold-500); }
    .perks li b { font-family: var(--font-display); font-size: 1.25rem; color: var(--oud-900); }
    .perks li span { color: var(--muted); }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip { border: 1.5px solid var(--line); background: var(--cream-50); border-radius: 999px; padding: 0.4rem 1rem; font-weight: 700; cursor: pointer; font-family: inherit; color: var(--oud-700); transition: 0.15s; }
    .chip:hover { border-color: var(--gold-400); }
    .chip.on { background: var(--oud-800); color: var(--gold-300); border-color: var(--oud-800); }
    .seal { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; font-size: 2.4rem; color: #fff; background: linear-gradient(135deg, var(--gold-400), var(--rose-500)); }
    @media (max-width: 860px) { .two { grid-template-columns: 1fr; } }
  `,
})
export class CommunityPage {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly interests = INTERESTS;
  readonly selected = signal(new Set<string>());
  readonly touched = signal(false);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100), noBlank]],
    phoneNumber: ['', [Validators.required, patternValidator(PATTERNS.phone, 'phone')]],
    email: ['', [Validators.required, Validators.email]],
  });

  toggle(key: string): void {
    const next = new Set(this.selected());
    next.has(key) ? next.delete(key) : next.add(key);
    this.selected.set(next);
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.touched.set(true);
    if (this.form.invalid || this.selected().size === 0) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const value = this.form.getRawValue();
      const labels = INTERESTS.filter((item) => this.selected().has(item[0])).map((item) => item[1]);
      await this.api.post('/events/community/join', {
        fullName: value.fullName.trim(),
        phoneNumber: value.phoneNumber,
        email: value.email.trim(),
        interests: labels.join('، '),
      });
      this.done.set(true);
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.error.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
