import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { fromSaudiInput, toSaudiInput } from '../../core/date';
import { PATTERNS, applyServerErrors, noBlank, patternValidator } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { Lookup, ProgramDetails, SessionDto, TrainerConflict } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../layout/icon';
import { EmptyComponent, FieldComponent, ModalComponent, SaudiDatePipe, StateBadgeComponent } from '../../shared/ui';
import { EnrollmentsPanel } from './enrollments-panel';

@Component({
  selector: 'app-program-detail',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, ModalComponent, FieldComponent, EmptyComponent, SaudiDatePipe, StateBadgeComponent, EnrollmentsPanel, IconComponent],
  template: `
    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (program(); as p) {
      <a routerLink="/app/programs" class="small bold">{{ i18n.isAr() ? '→' : '←' }} {{ i18n.t('menu.programs') }}</a>

      <section class="head card mt-1">
        <div class="grow">
          <div class="row">
            <app-state-badge [code]="p.state.code" [label]="i18n.pick(p.state.nameAr, p.state.nameEn)" />
            <span class="badge">{{ i18n.name(p.status) }}</span>
          </div>
          <h1>{{ i18n.pick(p.nameAr, p.nameEn) }}</h1>
          <p class="muted">{{ i18n.pick(p.descriptionAr, p.descriptionEn) }}</p>
          <dl class="kv">
            <dt>{{ i18n.t('f.seats') }}</dt>
            <dd>
              {{ p.state.acceptedCount }} / {{ p.seats }}
              <div class="progress mt-1" style="max-width:220px"><span [style.width.%]="p.seats ? (p.state.acceptedCount / p.seats) * 100 : 0"></span></div>
            </dd>
            <dt>{{ i18n.t('f.closesAt') }}</dt><dd>{{ p.registrationClosesAt ? (p.registrationClosesAt | sdate) : '—' }}</dd>
            <dt>{{ i18n.t('programs.firstSession') }}</dt><dd>{{ p.firstSessionStartsAt ? (p.firstSessionStartsAt | sdate) : '—' }}</dd>
          </dl>
        </div>
        <div class="actions">
          @if (auth.can('Programs.Edit')) { <button class="btn btn-ghost btn-sm" (click)="openEdit()">{{ i18n.t('common.edit') }}</button> }
          @if (p.status.id === 1 && auth.can('Programs.Publish')) { <button class="btn btn-primary btn-sm" (click)="publish()" [disabled]="busy()">{{ i18n.t('common.publish') }}</button> }
          @if (p.status.id === 2 && auth.can('Programs.Cancel')) { <button class="btn btn-danger btn-sm" (click)="cancelProgram()" [disabled]="busy()">{{ i18n.t('programs.cancel') }}</button> }
          @if (p.status.id === 1 && auth.can('Programs.Edit')) { <button class="btn btn-ghost btn-sm" (click)="remove()" [disabled]="busy()">{{ i18n.t('common.delete') }}</button> }
        </div>
      </section>

      <div class="tabs mt-3">
        <button class="tab" [class.active]="tab() === 'sessions'" (click)="tab.set('sessions')">{{ i18n.t('programs.tabSessions') }}</button>
        @if (auth.can('Enrollments.View')) {
          <button class="tab" [class.active]="tab() === 'enrollments'" (click)="tab.set('enrollments')">{{ i18n.t('programs.tabApplications') }}</button>
        }
      </div>

      @if (tab() === 'sessions') {
        <div class="row between mb-2">
          <h2 class="m0">{{ i18n.t('programs.tabSessions') }}</h2>
          @if (auth.can('Sessions.Create')) { <button class="btn btn-primary btn-sm" (click)="openSession()">+ {{ i18n.t('sessions.add') }}</button> }
        </div>
        @if (sessions().length === 0) {
          <app-empty [text]="i18n.t('sessions.none')" />
        } @else {
          <div class="stack">
            @for (s of sessions(); track s.id) {
              <article class="card sess" [class.cancelled]="s.isCancelled">
                <div class="when">
                  <b>{{ s.startsAt | sdate: 'date' }}</b>
                  <span>{{ s.startsAt | sdate: 'time' }} — {{ s.endsAt | sdate: 'time' }}</span>
                </div>
                <div class="grow">
                  <h3>{{ i18n.pick(s.topicAr, s.topicEn) }}</h3>
                  <div class="small muted row">
                    <span><app-icon name="user" [size]="15" /> {{ trainerNames(s) }}</span>
                    @if (s.meetingUrl) { <a [href]="s.meetingUrl" target="_blank" rel="noopener"><app-icon name="link" [size]="15" /> {{ i18n.t('sessions.link') }}</a> }
                    @if (s.isCancelled) { <span class="badge b-red">{{ i18n.t('status.cancelled') }}</span> }
                  </div>
                </div>
                <div class="row">
                  <a class="btn btn-outline btn-sm" [routerLink]="['/app/sessions', s.id]" [state]="{ title: i18n.pick(s.topicAr, s.topicEn) }">{{ i18n.t('sessions.manage') }}</a>
                  @if (!s.isCancelled) {
                    @if (auth.can('Sessions.Edit')) { <button class="btn btn-ghost btn-sm" (click)="openSession(s)">{{ i18n.t('common.edit') }}</button> }
                    @if (auth.can('Sessions.Cancel')) { <button class="btn btn-ghost btn-sm" (click)="cancelSession(s)">{{ i18n.t('common.cancel') }}</button> }
                  }
                </div>
              </article>
            }
          </div>
        }
      } @else {
        <app-enrollments-panel [programId]="p.id" (changed)="reloadProgram()" />
      }
    }

    <!-- Edit program -->
    <app-modal [open]="editOpen()" [title]="i18n.t('programs.edit')" [wide]="true" (closed)="editOpen.set(false)">
      <form [formGroup]="programForm" (ngSubmit)="saveProgram()" id="progEdit" novalidate>
        @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
        <div class="form-grid">
          <app-field [label]="i18n.t('f.nameAr')" [control]="programForm.controls.nameAr"><input class="input" formControlName="nameAr" /></app-field>
          <app-field [label]="i18n.t('f.nameEn')" [control]="programForm.controls.nameEn"><input class="input ltr" formControlName="nameEn" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descAr')" [control]="programForm.controls.descriptionAr"><textarea class="textarea" formControlName="descriptionAr"></textarea></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descEn')" [control]="programForm.controls.descriptionEn"><textarea class="textarea ltr" formControlName="descriptionEn"></textarea></app-field>
          <app-field [label]="i18n.t('f.seats')" [control]="programForm.controls.seats"><input class="input" type="number" formControlName="seats" /></app-field>
          <app-field [label]="i18n.t('f.closesAt')" [control]="programForm.controls.registrationClosesAt" [hint]="i18n.t('hint.saudiTime')"><input class="input" type="datetime-local" formControlName="registrationClosesAt" /></app-field>
        </div>
      </form>
      <div footer class="contents">
        <button class="btn btn-ghost" type="button" (click)="editOpen.set(false)">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-primary" type="submit" form="progEdit" [disabled]="busy()">{{ i18n.t('common.save') }}</button>
      </div>
    </app-modal>

    <!-- Session form -->
    <app-modal [open]="sessionOpen()" [title]="editingSession() ? i18n.t('sessions.edit') : i18n.t('sessions.add')" [wide]="true" (closed)="sessionOpen.set(false)">
      <form [formGroup]="sessionForm" (ngSubmit)="saveSession(false)" id="sessForm" novalidate>
        @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
        @if (conflicts().length > 0) {
          <div class="alert alert-warn mb-2">
            <b>{{ i18n.t('sessions.conflictTitle') }}</b>
            <ul class="conf">
              @for (c of conflicts(); track c.sessionId) {
                <li>{{ i18n.pick(c.programNameAr, c.programNameEn) }} — {{ i18n.pick(c.topicAr, c.topicEn) }} ({{ c.startsAt | sdate }})</li>
              }
            </ul>
            <button type="button" class="btn btn-primary btn-sm" (click)="saveSession(true)" [disabled]="busy()">{{ i18n.t('sessions.conflictConfirm') }}</button>
          </div>
        }
        <div class="form-grid">
          <app-field [label]="i18n.t('f.topicAr')" [control]="sessionForm.controls.topicAr"><input class="input" formControlName="topicAr" /></app-field>
          <app-field [label]="i18n.t('f.topicEn')" [control]="sessionForm.controls.topicEn"><input class="input ltr" formControlName="topicEn" /></app-field>
          <app-field [label]="i18n.t('f.startsAt')" [control]="sessionForm.controls.startsAt" [hint]="i18n.t('hint.saudiTime')"><input class="input" type="datetime-local" formControlName="startsAt" /></app-field>
          <app-field [label]="i18n.t('f.endsAt')" [control]="sessionForm.controls.endsAt"><input class="input" type="datetime-local" formControlName="endsAt" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.meetingUrl')" [control]="sessionForm.controls.meetingUrl" [hint]="i18n.t('hint.https')"><input class="input ltr" formControlName="meetingUrl" placeholder="https://meet.example.com/..." /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.trainer')" [control]="sessionForm.controls.trainerId">
            <select class="select" formControlName="trainerId">
              <option [ngValue]="0">{{ i18n.t('common.choose') }}</option>
              @for (t of trainers(); track t.id) { <option [ngValue]="t.id">{{ i18n.name(t) }}</option> }
            </select>
          </app-field>
        </div>
      </form>
      <div footer class="contents">
        <button class="btn btn-ghost" type="button" (click)="sessionOpen.set(false)">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-primary" type="submit" form="sessForm" [disabled]="busy()">{{ i18n.t('common.save') }}</button>
      </div>
    </app-modal>
  `,
  styles: `
    .head { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }
    .head h1 { font-size: 2rem; margin: 0.6rem 0 0.4rem; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px; }
    .m0 { margin: 0; }
    .sess { display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap; padding: 1.1rem 1.4rem; }
    .sess.cancelled { opacity: 0.6; background: var(--cream-100); }
    .sess h3 { margin: 0 0 0.25rem; }
    .when { display: flex; flex-direction: column; min-width: 150px; padding-inline-end: 1.2rem; border-inline-end: 3px solid var(--gold-500); }
    .when b { font-family: var(--font-display); font-size: 1.15rem; }
    .when span { font-size: 0.85rem; color: var(--muted); }
    .small app-icon { color: var(--gold-600); margin-inline-end: 0.2rem; }
    .conf { margin: 0.5rem 0 0.8rem; padding-inline-start: 1.2rem; font-weight: 500; }
  `,
})
export class ProgramDetailPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly program = signal<ProgramDetails | null>(null);
  readonly sessions = signal<SessionDto[]>([]);
  readonly trainers = signal<Lookup[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly tab = signal<'sessions' | 'enrollments'>('sessions');
  readonly editOpen = signal(false);
  readonly sessionOpen = signal(false);
  readonly editingSession = signal<SessionDto | null>(null);
  readonly conflicts = signal<TrainerConflict[]>([]);
  readonly formError = signal('');

  readonly programForm = this.fb.group({
    nameAr: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    nameEn: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    descriptionAr: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    descriptionEn: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    seats: [30, [Validators.required, Validators.min(1), Validators.max(1000)]],
    registrationClosesAt: [''],
  });

  readonly sessionForm = this.fb.group({
    topicAr: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    topicEn: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    startsAt: ['', [Validators.required]],
    endsAt: ['', [Validators.required]],
    meetingUrl: ['', [Validators.required, patternValidator(PATTERNS.https, 'https')]],
    trainerId: [0, [Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    await this.reloadProgram();
    await this.loadSessions();
    this.loading.set(false);
    if (this.auth.can('Sessions.Create', 'Sessions.Edit')) {
      try {
        this.trainers.set((await this.api.get<Lookup[]>('/lookups/trainers')).data);
      } catch {
        /* trainers are only needed for the session form */
      }
    }
  }

  async reloadProgram(): Promise<void> {
    try {
      this.program.set((await this.api.get<ProgramDetails>(`/programs/${this.id()}`)).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
      await this.router.navigateByUrl('/app/programs');
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      this.sessions.set((await this.api.get<SessionDto[]>(`/programs/${this.id()}/sessions`)).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    }
  }

  trainerNames(session: SessionDto): string {
    return session.trainers.map((t) => this.i18n.name(t)).join('، ') || '—';
  }

  // ── program actions ──
  openEdit(): void {
    const p = this.program();
    if (!p) {
      return;
    }
    this.programForm.reset({
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      seats: p.seats,
      registrationClosesAt: toSaudiInput(p.registrationClosesAt),
    });
    this.formError.set('');
    this.editOpen.set(true);
  }

  async saveProgram(): Promise<void> {
    this.programForm.markAllAsTouched();
    if (this.programForm.invalid) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      const value = this.programForm.getRawValue();
      await this.api.put(`/programs/${this.id()}`, { ...value, registrationClosesAt: fromSaudiInput(value.registrationClosesAt) });
      this.toast.success(this.i18n.t('common.saved'));
      this.editOpen.set(false);
      await this.reloadProgram();
    } catch (error) {
      applyServerErrors(this.programForm, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async publish(): Promise<void> {
    await this.simple(() => this.api.post(`/programs/${this.id()}/publish`), 'programs.published');
  }

  async cancelProgram(): Promise<void> {
    const ok = await this.ask(this.i18n.t('programs.cancel'), this.i18n.t('programs.cancelConfirm'));
    if (ok) {
      await this.simple(() => this.api.post(`/programs/${this.id()}/cancel`), 'common.done');
    }
  }

  async remove(): Promise<void> {
    const ok = await this.ask(this.i18n.t('common.delete'), this.i18n.t('programs.deleteConfirm'));
    if (!ok) {
      return;
    }
    this.busy.set(true);
    try {
      await this.api.delete(`/programs/${this.id()}`);
      this.toast.success(this.i18n.t('common.done'));
      await this.router.navigateByUrl('/app/programs');
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  // ── sessions ──
  openSession(session?: SessionDto): void {
    this.editingSession.set(session ?? null);
    this.conflicts.set([]);
    this.formError.set('');
    this.sessionForm.reset({
      topicAr: session?.topicAr ?? '',
      topicEn: session?.topicEn ?? '',
      startsAt: toSaudiInput(session?.startsAt),
      endsAt: toSaudiInput(session?.endsAt),
      meetingUrl: session?.meetingUrl ?? '',
      trainerId: session?.trainers[0]?.id ?? 0,
    });
    this.sessionOpen.set(true);
  }

  async saveSession(confirmConflict: boolean): Promise<void> {
    this.sessionForm.markAllAsTouched();
    if (this.sessionForm.invalid) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      const value = this.sessionForm.getRawValue();
      const body = {
        ...value,
        startsAt: fromSaudiInput(value.startsAt),
        endsAt: fromSaudiInput(value.endsAt),
        meetingUrl: value.meetingUrl.trim(),
        confirmTrainerConflict: confirmConflict,
      };
      const editing = this.editingSession();
      if (editing) {
        await this.api.put(`/sessions/${editing.id}`, body);
      } else {
        await this.api.post(`/programs/${this.id()}/sessions`, body);
      }
      this.toast.success(this.i18n.t('common.saved'));
      this.sessionOpen.set(false);
      await Promise.all([this.loadSessions(), this.reloadProgram()]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const data = error.response?.data as { trainerConflicts?: TrainerConflict[] } | null;
        if (data?.trainerConflicts?.length) {
          this.conflicts.set(data.trainerConflicts);
          return;
        }
      }
      applyServerErrors(this.sessionForm, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async cancelSession(session: SessionDto): Promise<void> {
    const ok = await this.ask(this.i18n.t('sessions.cancel'), this.i18n.t('sessions.cancelConfirm'));
    if (!ok) {
      return;
    }
    await this.simple(async () => {
      await this.api.post(`/sessions/${session.id}/cancel`);
      await this.loadSessions();
    }, 'common.done');
  }

  private ask(title: string, message: string): Promise<boolean> {
    return this.confirm.ask({ title, message, confirmLabel: this.i18n.t('common.confirm'), cancelLabel: this.i18n.t('common.back'), danger: true });
  }

  private async simple(action: () => Promise<unknown>, successKey: string): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.i18n.t(successKey));
      await this.reloadProgram();
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
