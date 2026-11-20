import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { fromSaudiInput, toSaudiInput } from '../../core/date';
import { applyServerErrors, noBlank } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { EventAttendee, EventDetails, Lookup, Paged, EventBrowseItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmptyComponent, FieldComponent, ModalComponent, SaudiDatePipe, StateBadgeComponent } from '../../shared/ui';

const KNOWN_KEY = 'safarat.admin.events';

@Component({
  selector: 'app-events-admin',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, ModalComponent, FieldComponent, EmptyComponent, SaudiDatePipe, StateBadgeComponent],
  template: `
    <div class="page-head">
      <div><h1>{{ i18n.t('evadmin.title') }}</h1><p>{{ i18n.t('evadmin.subtitle') }}</p></div>
      @if (auth.can('Events.Create')) { <button class="btn btn-primary" (click)="openForm()">+ {{ i18n.t('evadmin.add') }}</button> }
    </div>

    <div class="tabs">
      <button class="tab" [class.active]="tab() === 'events'" (click)="tab.set('events')">{{ i18n.t('evadmin.tabEvents') }}</button>
      @if (auth.can('Events.CheckIn')) { <button class="tab" [class.active]="tab() === 'checkin'" (click)="tab.set('checkin')">{{ i18n.t('evadmin.tabCheckin') }}</button> }
    </div>

    @if (tab() === 'events') {
      <div class="alert alert-info mb-2 small">{{ i18n.t('evadmin.note') }}</div>
      <div class="row mb-2">
        <input class="input" style="max-width:220px" type="number" [(ngModel)]="openId" [placeholder]="i18n.t('evadmin.openById')" />
        <button class="btn btn-dark btn-sm" (click)="addKnown()" [disabled]="!openId">{{ i18n.t('evadmin.addToList') }}</button>
      </div>
      @if (loading()) {
        <div class="loading-block"><span class="spinner"></span></div>
      } @else if (events().length === 0) {
        <app-empty [text]="i18n.t('evadmin.none')" />
      } @else {
        <div class="stack">
          @for (e of events(); track e.id) {
            <article class="card ev">
              <div class="grow">
                <div class="row">
                  <app-state-badge [code]="e.status.id === 2 ? 'Published' : e.status.id === 3 ? 'Cancelled' : 'Draft'" [label]="i18n.name(e.status)" />
                  <span class="muted xs">#{{ e.id }}</span>
                </div>
                <h3>{{ i18n.pick(e.titleAr, e.titleEn) }}</h3>
                <div class="small muted">{{ e.startsAt | sdate }} · {{ i18n.name(e.city) }} — {{ e.location }}</div>
                <div class="seats small">{{ i18n.t('programs.seatsOf', { a: e.bookedSeats, b: e.seats }) }}</div>
              </div>
              <div class="row">
                <a class="btn btn-ghost btn-sm" [routerLink]="['/events', e.id]" target="_blank">{{ i18n.t('evadmin.view') }}</a>
                @if (auth.can('Events.View')) { <button class="btn btn-outline btn-sm" (click)="openAttendees(e)">{{ i18n.t('evadmin.attendees') }}</button> }
                @if (e.status.id !== 3) {
                  @if (auth.can('Events.Edit')) { <button class="btn btn-ghost btn-sm" (click)="openForm(e)">{{ i18n.t('common.edit') }}</button> }
                  @if (e.status.id === 1 && auth.can('Events.Publish')) { <button class="btn btn-primary btn-sm" (click)="publish(e)">{{ i18n.t('common.publish') }}</button> }
                  @if (e.status.id === 2 && auth.can('Events.Cancel')) { <button class="btn btn-danger btn-sm" (click)="cancel(e)">{{ i18n.t('programs.cancel') }}</button> }
                }
              </div>
            </article>
          }
        </div>
      }
    } @else {
      <div class="card" style="max-width:520px">
        <h3>{{ i18n.t('evadmin.checkinTitle') }}</h3>
        <p class="muted small">{{ i18n.t('evadmin.checkinText') }}</p>
        <div class="field"><input class="input ltr code" [(ngModel)]="code" placeholder="XXXXXXXX" (keyup.enter)="checkIn()" /></div>
        <button class="btn btn-primary" (click)="checkIn()" [disabled]="!code.trim() || busy()">{{ i18n.t('evadmin.checkinBtn') }}</button>
      </div>
    }

    <!-- Event form -->
    <app-modal [open]="formOpen()" [title]="editing() ? i18n.t('evadmin.edit') : i18n.t('evadmin.add')" [wide]="true" (closed)="formOpen.set(false)">
      <form [formGroup]="form" (ngSubmit)="save()" id="evForm" novalidate>
        @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
        <div class="form-grid">
          <app-field [label]="i18n.t('f.titleAr')" [control]="form.controls.titleAr"><input class="input" formControlName="titleAr" /></app-field>
          <app-field [label]="i18n.t('f.titleEn')" [control]="form.controls.titleEn"><input class="input ltr" formControlName="titleEn" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descAr')" [control]="form.controls.descriptionAr"><textarea class="textarea" formControlName="descriptionAr"></textarea></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descEn')" [control]="form.controls.descriptionEn"><textarea class="textarea ltr" formControlName="descriptionEn"></textarea></app-field>
          <app-field [label]="i18n.t('f.city')" [control]="form.controls.cityId">
            <select class="select" formControlName="cityId">
              <option [ngValue]="0">{{ i18n.t('common.choose') }}</option>
              @for (c of cities(); track c.id) { <option [ngValue]="c.id">{{ i18n.name(c) }}</option> }
            </select>
          </app-field>
          <app-field [label]="i18n.t('f.seats')" [control]="form.controls.seats"><input class="input" type="number" min="1" max="5000" formControlName="seats" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.location')" [control]="form.controls.location"><input class="input" formControlName="location" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.speakers')" [control]="form.controls.speakers"><input class="input" formControlName="speakers" /></app-field>
          <app-field [label]="i18n.t('f.startsAt')" [control]="form.controls.startsAt" [hint]="i18n.t('hint.saudiTime')"><input class="input" type="datetime-local" formControlName="startsAt" /></app-field>
          <app-field [label]="i18n.t('f.endsAt')" [control]="form.controls.endsAt"><input class="input" type="datetime-local" formControlName="endsAt" /></app-field>
        </div>
      </form>
      <div footer class="contents">
        <button class="btn btn-ghost" type="button" (click)="formOpen.set(false)">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-primary" type="submit" form="evForm" [disabled]="busy()">{{ i18n.t('common.save') }}</button>
      </div>
    </app-modal>

    <!-- Attendees -->
    <app-modal [open]="!!attendeesFor()" [title]="i18n.t('evadmin.attendees')" [wide]="true" (closed)="attendeesFor.set(null)">
      @if (attendees().length === 0) {
        <app-empty [text]="i18n.t('evadmin.noAttendees')" />
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>{{ i18n.t('f.name') }}</th><th>{{ i18n.t('f.phone') }}</th><th>{{ i18n.t('booking.code') }}</th><th>{{ i18n.t('f.companions') }}</th><th>{{ i18n.t('f.status') }}</th></tr></thead>
            <tbody>
              @for (a of attendees(); track a.bookingId) {
                <tr>
                  <td><b>{{ a.fullName }}</b><div class="xs muted ltr">{{ a.email }}</div></td>
                  <td class="ltr">{{ a.phoneNumber }}</td>
                  <td class="ltr bold">{{ a.bookingCode }}</td>
                  <td>{{ a.companionsCount }}</td>
                  <td>
                    @if (a.isCancelled) { <span class="badge b-red">{{ i18n.t('status.cancelled') }}</span> }
                    @else if (a.isAttended) { <span class="badge b-green">{{ i18n.t('evadmin.attended') }}</span> }
                    @else { <span class="badge">{{ i18n.t('evadmin.booked') }}</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </app-modal>
  `,
  styles: `.ev { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; } .ev h3 { margin: 0.3rem 0; } .code { font-size: 1.3rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }`,
})
export class EventsAdminPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly tab = signal<'events' | 'checkin'>('events');
  readonly events = signal<EventDetails[]>([]);
  readonly cities = signal<Lookup[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<EventDetails | null>(null);
  readonly formError = signal('');
  readonly attendeesFor = signal<EventDetails | null>(null);
  readonly attendees = signal<EventAttendee[]>([]);
  openId: number | null = null;
  code = '';

  readonly form = this.fb.group({
    titleAr: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    titleEn: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    descriptionAr: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    descriptionEn: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    cityId: [0, [Validators.min(1)]],
    location: ['', [Validators.required, Validators.maxLength(500), noBlank]],
    speakers: ['', [Validators.maxLength(500)]],
    startsAt: ['', [Validators.required]],
    endsAt: ['', [Validators.required]],
    seats: [100, [Validators.required, Validators.min(1), Validators.max(5000)]],
  });

  async ngOnInit(): Promise<void> {
    try {
      this.cities.set((await this.api.get<Lookup[]>('/lookups/cities')).data);
    } catch {
      /* optional */
    }
    await this.refresh();
  }

  private knownIds(): number[] {
    try {
      return JSON.parse(localStorage.getItem(KNOWN_KEY) ?? '[]') as number[];
    } catch {
      return [];
    }
  }

  private remember(id: number): void {
    const ids = new Set(this.knownIds());
    ids.add(id);
    localStorage.setItem(KNOWN_KEY, JSON.stringify([...ids]));
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    const ids = new Set(this.knownIds());
    try {
      const page = await this.api.get<Paged<EventBrowseItem>>('/events/browse', { pageNumber: 1, pageSize: 50 });
      page.data.items.forEach((item) => ids.add(item.id));
    } catch {
      /* ignore: we still show remembered events */
    }
    const loaded = await Promise.all(
      [...ids].map(async (id) => {
        try {
          return (await this.api.get<EventDetails>(`/events/${id}`)).data;
        } catch {
          return null;
        }
      }),
    );
    this.events.set(loaded.filter((e): e is EventDetails => e !== null).sort((a, b) => b.id - a.id));
    this.loading.set(false);
  }

  async addKnown(): Promise<void> {
    if (!this.openId) {
      return;
    }
    this.remember(this.openId);
    this.openId = null;
    await this.refresh();
  }

  openForm(event?: EventDetails): void {
    this.editing.set(event ?? null);
    this.formError.set('');
    this.form.reset({
      titleAr: event?.titleAr ?? '',
      titleEn: event?.titleEn ?? '',
      descriptionAr: event?.descriptionAr ?? '',
      descriptionEn: event?.descriptionEn ?? '',
      cityId: event?.city.id ?? 0,
      location: event?.location ?? '',
      speakers: event?.speakers ?? '',
      startsAt: toSaudiInput(event?.startsAt),
      endsAt: toSaudiInput(event?.endsAt),
      seats: event?.seats ?? 100,
    });
    this.formOpen.set(true);
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      const value = this.form.getRawValue();
      const body = { ...value, speakers: value.speakers.trim() || null, startsAt: fromSaudiInput(value.startsAt), endsAt: fromSaudiInput(value.endsAt) };
      const existing = this.editing();
      const response = existing ? await this.api.put<EventDetails>(`/events/${existing.id}`, body) : await this.api.post<EventDetails>('/events', body);
      this.remember(response.data?.id ?? existing?.id ?? 0);
      this.toast.success(this.i18n.t('common.saved'));
      this.formOpen.set(false);
      await this.refresh();
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async publish(event: EventDetails): Promise<void> {
    await this.run(() => this.api.post(`/events/${event.id}/publish`));
  }

  async cancel(event: EventDetails): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('programs.cancel'),
      message: this.i18n.t('evadmin.cancelConfirm'),
      confirmLabel: this.i18n.t('common.confirm'),
      cancelLabel: this.i18n.t('common.back'),
      danger: true,
    });
    if (ok) {
      await this.run(() => this.api.post(`/events/${event.id}/cancel`));
    }
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.i18n.t('common.done'));
      await this.refresh();
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async openAttendees(event: EventDetails): Promise<void> {
    try {
      this.attendees.set((await this.api.get<EventAttendee[]>(`/events/${event.id}/attendees`)).data);
      this.attendeesFor.set(event);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    }
  }

  async checkIn(): Promise<void> {
    this.busy.set(true);
    try {
      await this.api.post('/events/check-in', { bookingCode: this.code.trim() });
      this.toast.success(this.i18n.t('evadmin.checkedIn'));
      this.code = '';
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
