import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { fromSaudiInput, toSaudiInput } from '../../core/date';
import { PATTERNS, applyServerErrors, noBlank, patternValidator } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { Lookup, Paged, ProgramListItem, TrainerConflict, WorkshopDetails } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../layout/icon';
import { EmptyComponent, FieldComponent, ModalComponent, PaginationComponent, SaudiDatePipe, StateBadgeComponent } from '../../shared/ui';
import { EnrollmentsPanel } from './enrollments-panel';

// ───────────────────────── Create / edit form ─────────────────────────
@Component({
  selector: 'app-workshop-form',
  imports: [ReactiveFormsModule, ModalComponent, FieldComponent, SaudiDatePipe],
  template: `
    <app-modal [open]="open()" [title]="workshop() ? i18n.t('workshops.edit') : i18n.t('workshops.add')" [wide]="true" (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="save(false)" id="wsForm" novalidate>
        @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
        @if (conflicts().length > 0) {
          <div class="alert alert-warn mb-2">
            <b>{{ i18n.t('sessions.conflictTitle') }}</b>
            <ul class="conf">
              @for (c of conflicts(); track c.sessionId) {
                <li>{{ i18n.pick(c.programNameAr, c.programNameEn) }} — {{ i18n.pick(c.topicAr, c.topicEn) }} ({{ c.startsAt | sdate }})</li>
              }
            </ul>
            <button type="button" class="btn btn-primary btn-sm" (click)="save(true)" [disabled]="busy()">{{ i18n.t('sessions.conflictConfirm') }}</button>
          </div>
        }
        <div class="form-grid">
          <app-field [label]="i18n.t('f.nameAr')" [control]="form.controls.nameAr"><input class="input" formControlName="nameAr" /></app-field>
          <app-field [label]="i18n.t('f.nameEn')" [control]="form.controls.nameEn"><input class="input ltr" formControlName="nameEn" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descAr')" [control]="form.controls.descriptionAr"><textarea class="textarea" formControlName="descriptionAr"></textarea></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descEn')" [control]="form.controls.descriptionEn"><textarea class="textarea ltr" formControlName="descriptionEn"></textarea></app-field>
          <app-field [label]="i18n.t('f.seats')" [control]="form.controls.seats"><input class="input" type="number" formControlName="seats" /></app-field>
          <app-field [label]="i18n.t('f.closesAt')" [control]="form.controls.registrationClosesAt" [hint]="i18n.t('hint.saudiTime')"><input class="input" type="datetime-local" formControlName="registrationClosesAt" /></app-field>
          <app-field [label]="i18n.t('ws.followUpDays')" [control]="form.controls.followUpDelayDays" [hint]="i18n.t('ws.followUpHint')"><input class="input" type="number" min="1" formControlName="followUpDelayDays" /></app-field>
        </div>
        <h3 class="mt-2">{{ i18n.t('ws.sessionSection') }}</h3>
        <div class="form-grid">
          <app-field [label]="i18n.t('f.topicAr')" [control]="form.controls.topicAr"><input class="input" formControlName="topicAr" /></app-field>
          <app-field [label]="i18n.t('f.topicEn')" [control]="form.controls.topicEn"><input class="input ltr" formControlName="topicEn" /></app-field>
          <app-field [label]="i18n.t('f.startsAt')" [control]="form.controls.startsAt" [hint]="i18n.t('hint.saudiTime')"><input class="input" type="datetime-local" formControlName="startsAt" /></app-field>
          <app-field [label]="i18n.t('f.endsAt')" [control]="form.controls.endsAt"><input class="input" type="datetime-local" formControlName="endsAt" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.meetingUrl')" [control]="form.controls.meetingUrl" [hint]="i18n.t('hint.https')"><input class="input ltr" formControlName="meetingUrl" /></app-field>
        </div>
        <div class="field">
          <label>{{ i18n.t('ws.experts') }}</label>
          <div class="experts">
            @for (t of trainers(); track t.id) {
              <label class="check pill" [class.on]="selected().has(t.id)">
                <input type="checkbox" [checked]="selected().has(t.id)" (change)="toggle(t.id)" /> {{ i18n.name(t) }}
              </label>
            }
          </div>
          @if (expertsTouched() && selected().size === 0) { <span class="field-error">{{ i18n.t('val.required') }}</span> }
        </div>
      </form>
      <div footer class="contents">
        <button class="btn btn-ghost" type="button" (click)="closed.emit()">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-primary" type="submit" form="wsForm" [disabled]="busy()">{{ i18n.t('common.save') }}</button>
      </div>
    </app-modal>
  `,
  styles: `
    .experts { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pill { border: 1.5px solid var(--line); border-radius: 999px; padding: 0.35rem 0.9rem; background: var(--cream-50); }
    .pill.on { border-color: var(--gold-500); background: #fff9e8; }
    .conf { margin: 0.5rem 0 0.8rem; padding-inline-start: 1.2rem; font-weight: 500; }
  `,
})
export class WorkshopForm {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toast = inject(ToastService);

  readonly open = input(false);
  readonly workshop = input<WorkshopDetails | null>(null);
  readonly trainers = input<Lookup[]>([]);
  readonly closed = output<void>();
  readonly saved = output<number>();

  readonly busy = signal(false);
  readonly formError = signal('');
  readonly conflicts = signal<TrainerConflict[]>([]);
  readonly selected = signal(new Set<number>());
  readonly expertsTouched = signal(false);

  readonly form = this.fb.group({
    nameAr: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    nameEn: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    descriptionAr: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    descriptionEn: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    seats: [20, [Validators.required, Validators.min(1), Validators.max(1000)]],
    registrationClosesAt: [''],
    followUpDelayDays: [30 as number | null, [Validators.min(1)]],
    topicAr: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    topicEn: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    startsAt: ['', [Validators.required]],
    endsAt: ['', [Validators.required]],
    meetingUrl: ['', [Validators.required, patternValidator(PATTERNS.https, 'https')]],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }
      const w = this.workshop();
      this.formError.set('');
      this.conflicts.set([]);
      this.expertsTouched.set(false);
      this.selected.set(new Set(w?.session.experts.map((e) => e.id) ?? []));
      this.form.reset({
        nameAr: w?.nameAr ?? '',
        nameEn: w?.nameEn ?? '',
        descriptionAr: w?.descriptionAr ?? '',
        descriptionEn: w?.descriptionEn ?? '',
        seats: w?.seats ?? 20,
        registrationClosesAt: toSaudiInput(w?.registrationClosesAt),
        followUpDelayDays: w?.followUpDelayDays ?? 30,
        topicAr: w?.session.topicAr ?? '',
        topicEn: w?.session.topicEn ?? '',
        startsAt: toSaudiInput(w?.session.startsAt),
        endsAt: toSaudiInput(w?.session.endsAt),
        meetingUrl: w?.session.meetingUrl ?? '',
      });
    });
  }

  toggle(id: number): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  async save(confirmConflict: boolean): Promise<void> {
    this.form.markAllAsTouched();
    this.expertsTouched.set(true);
    if (this.form.invalid || this.selected().size === 0) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      const value = this.form.getRawValue();
      const body = {
        ...value,
        registrationClosesAt: fromSaudiInput(value.registrationClosesAt),
        startsAt: fromSaudiInput(value.startsAt),
        endsAt: fromSaudiInput(value.endsAt),
        meetingUrl: value.meetingUrl.trim(),
        followUpDelayDays: value.followUpDelayDays || null,
        expertIds: [...this.selected()],
        confirmTrainerConflict: confirmConflict,
      };
      const existing = this.workshop();
      const response = existing ? await this.api.put<{ id: number }>(`/workshops/${existing.id}`, body) : await this.api.post<{ id: number }>('/workshops', body);
      this.toast.success(this.i18n.t('common.saved'));
      this.saved.emit(existing?.id ?? response.data.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const data = error.response?.data as { trainerConflicts?: TrainerConflict[] } | null;
        if (data?.trainerConflicts?.length) {
          this.conflicts.set(data.trainerConflicts);
          return;
        }
      }
      applyServerErrors(this.form, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}

// ───────────────────────── List ─────────────────────────
@Component({
  selector: 'app-workshops-page',
  imports: [FormsModule, RouterLink, PaginationComponent, EmptyComponent, SaudiDatePipe, StateBadgeComponent, WorkshopForm],
  template: `
    <div class="page-head">
      <div><h1>{{ i18n.t('workshops.title') }}</h1><p>{{ i18n.t('workshops.subtitle') }}</p></div>
      @if (auth.can('Workshops.Create')) { <button class="btn btn-primary" (click)="openCreate()">+ {{ i18n.t('workshops.add') }}</button> }
    </div>
    <div class="filters">
      <input class="input search" [(ngModel)]="search" (keyup.enter)="load(1)" [placeholder]="i18n.t('programs.searchPh')" />
      <select class="select" [(ngModel)]="statusId" (change)="load(1)">
        <option [ngValue]="null">{{ i18n.t('programs.allStatus') }}</option>
        <option [ngValue]="1">{{ i18n.t('status.draft') }}</option>
        <option [ngValue]="2">{{ i18n.t('status.published') }}</option>
        <option [ngValue]="3">{{ i18n.t('status.cancelled') }}</option>
      </select>
      <button class="btn btn-dark btn-sm" (click)="load(1)">{{ i18n.t('common.search') }}</button>
    </div>
    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (data().items.length === 0) {
      <app-empty [text]="i18n.t('workshops.none')" />
    } @else {
      <div class="grid grid-auto">
        @for (w of data().items; track w.id) {
          <a class="card card-hover prog" [routerLink]="['/app/workshops', w.id]">
            <div class="row between">
              <app-state-badge [code]="w.state.code" [label]="i18n.pick(w.state.nameAr, w.state.nameEn)" />
              <span class="badge">{{ i18n.name(w.status) }}</span>
            </div>
            <h3>{{ i18n.pick(w.nameAr, w.nameEn) }}</h3>
            <div class="progress"><span [style.width.%]="w.seats ? (w.state.acceptedCount / w.seats) * 100 : 0"></span></div>
            <div class="small muted">
              {{ i18n.t('programs.seatsOf', { a: w.state.acceptedCount, b: w.seats }) }}
              @if (w.firstSessionStartsAt) { · {{ w.firstSessionStartsAt | sdate }} }
            </div>
          </a>
        }
      </div>
      <app-pagination [page]="data().pageNumber" [totalPages]="data().totalPages" (pageChange)="load($event)" />
    }
    <app-workshop-form [open]="formOpen()" [trainers]="trainers()" (closed)="formOpen.set(false)" (saved)="created($event)" />
  `,
  styles: `.prog { display: flex; flex-direction: column; gap: 0.7rem; color: var(--ink); } .prog h3 { margin: 0; min-height: 2.6em; }`,
})
export class WorkshopsPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly data = signal<Paged<ProgramListItem>>({ items: [], pageNumber: 1, pageSize: 9, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly trainers = signal<Lookup[]>([]);
  search = '';
  statusId: number | null = null;

  async ngOnInit(): Promise<void> {
    this.load(1);
    if (this.auth.can('Sessions.Create', 'Sessions.Edit')) {
      try {
        this.trainers.set((await this.api.get<Lookup[]>('/lookups/trainers')).data);
      } catch {
        /* only required for the form */
      }
    }
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      this.data.set((await this.api.get<Paged<ProgramListItem>>('/workshops', { pageNumber: page, pageSize: 9, search: this.search.trim(), statusId: this.statusId })).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.formOpen.set(true);
  }

  async created(id: number): Promise<void> {
    this.formOpen.set(false);
    await this.router.navigate(['/app/workshops', id]);
  }
}

// ───────────────────────── Detail ─────────────────────────
@Component({
  selector: 'app-workshop-detail',
  imports: [RouterLink, SaudiDatePipe, StateBadgeComponent, EnrollmentsPanel, WorkshopForm, IconComponent],
  template: `
    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (w(); as ws) {
      <a routerLink="/app/workshops" class="small bold">{{ i18n.isAr() ? '→' : '←' }} {{ i18n.t('menu.workshops') }}</a>
      <section class="card head mt-1">
        <div class="grow">
          <div class="row">
            <app-state-badge [code]="ws.state.code" [label]="i18n.pick(ws.state.nameAr, ws.state.nameEn)" />
            <span class="badge">{{ i18n.name(ws.status) }}</span>
          </div>
          <h1>{{ i18n.pick(ws.nameAr, ws.nameEn) }}</h1>
          <p class="muted">{{ i18n.pick(ws.descriptionAr, ws.descriptionEn) }}</p>
          <dl class="kv">
            <dt>{{ i18n.t('f.seats') }}</dt>
            <dd>{{ ws.acceptedCount }} / {{ ws.seats }}<div class="progress mt-1" style="max-width:220px"><span [style.width.%]="ws.seats ? (ws.acceptedCount / ws.seats) * 100 : 0"></span></div></dd>
            <dt>{{ i18n.t('f.closesAt') }}</dt><dd>{{ ws.registrationClosesAt ? (ws.registrationClosesAt | sdate) : '—' }}</dd>
            <dt>{{ i18n.t('ws.followUpDays') }}</dt><dd>{{ ws.followUpDelayDays }}</dd>
          </dl>
        </div>
        <div class="actions">
          @if (auth.can('Workshops.Edit')) { <button class="btn btn-ghost btn-sm" (click)="formOpen.set(true)">{{ i18n.t('common.edit') }}</button> }
          @if (ws.status.id === 1 && auth.can('Workshops.Publish')) { <button class="btn btn-primary btn-sm" (click)="publish()" [disabled]="busy()">{{ i18n.t('common.publish') }}</button> }
          @if (ws.status.id === 2 && auth.can('Workshops.Cancel')) { <button class="btn btn-danger btn-sm" (click)="cancel()" [disabled]="busy()">{{ i18n.t('programs.cancel') }}</button> }
        </div>
      </section>

      <section class="card mt-3">
        <h3>{{ i18n.t('ws.sessionSection') }}</h3>
        <div class="row between">
          <div>
            <b class="topic">{{ i18n.pick(ws.session.topicAr, ws.session.topicEn) }}</b>
            <div class="small muted mt-1">
              <app-icon name="calendar" [size]="15" /> {{ ws.session.startsAt | sdate }} — {{ ws.session.endsAt | sdate: 'time' }}
              · <app-icon name="user" [size]="15" /> {{ experts(ws) }}
            </div>
            @if (ws.session.meetingUrl) { <a class="small" [href]="ws.session.meetingUrl" target="_blank" rel="noopener"><app-icon name="link" [size]="15" /> {{ i18n.t('sessions.link') }}</a> }
          </div>
          <a class="btn btn-outline btn-sm" [routerLink]="['/app/sessions', ws.session.id]" [state]="{ title: i18n.pick(ws.session.topicAr, ws.session.topicEn) }">{{ i18n.t('sessions.manage') }}</a>
        </div>
      </section>

      @if (auth.can('Enrollments.View')) {
        <h2 class="mt-4">{{ i18n.t('programs.tabApplications') }}</h2>
        <app-enrollments-panel [programId]="ws.id" (changed)="reload()" />
      }

      <app-workshop-form [open]="formOpen()" [workshop]="ws" [trainers]="trainers()" (closed)="formOpen.set(false)" (saved)="saved()" />
    }
  `,
  styles: `
    .head { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }
    .head h1 { font-size: 2rem; margin: 0.6rem 0 0.4rem; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px; }
    .topic { font-family: var(--font-display); font-size: 1.25rem; }
    app-icon { color: var(--gold-600); }
  `,
})
export class WorkshopDetailPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly w = signal<WorkshopDetails | null>(null);
  readonly trainers = signal<Lookup[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly formOpen = signal(false);

  async ngOnInit(): Promise<void> {
    await this.reload();
    this.loading.set(false);
    if (this.auth.can('Sessions.Create', 'Sessions.Edit')) {
      try {
        this.trainers.set((await this.api.get<Lookup[]>('/lookups/trainers')).data);
      } catch {
        /* only required for the form */
      }
    }
  }

  experts(ws: WorkshopDetails): string {
    return ws.session.experts.map((e) => this.i18n.name(e)).join('، ') || '—';
  }

  async reload(): Promise<void> {
    try {
      this.w.set((await this.api.get<WorkshopDetails>(`/workshops/${this.id()}`)).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
      await this.router.navigateByUrl('/app/workshops');
    }
  }

  async saved(): Promise<void> {
    this.formOpen.set(false);
    await this.reload();
  }

  async publish(): Promise<void> {
    await this.run(() => this.api.post(`/workshops/${this.id()}/publish`), 'programs.published');
  }

  async cancel(): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('programs.cancel'),
      message: this.i18n.t('workshops.cancelConfirm'),
      confirmLabel: this.i18n.t('common.confirm'),
      cancelLabel: this.i18n.t('common.back'),
      danger: true,
    });
    if (ok) {
      await this.run(() => this.api.post(`/workshops/${this.id()}/cancel`), 'common.done');
    }
  }

  private async run(action: () => Promise<unknown>, successKey: string): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.i18n.t(successKey));
      await this.reload();
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
