import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { PATTERNS } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { AttendanceItem, MaterialItem, MySession, Paged, RatingSummary } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../layout/icon';
import { EmptyComponent, FieldComponent, PaginationComponent, SaudiDatePipe, StarsComponent } from '../../shared/ui';

// ───────────────────────── My sessions (trainer) ─────────────────────────
@Component({
  selector: 'app-my-sessions',
  imports: [FormsModule, RouterLink, PaginationComponent, EmptyComponent, SaudiDatePipe, IconComponent],
  template: `
    <div class="page-head"><div><h1>{{ i18n.t('mys.title') }}</h1><p>{{ i18n.t('mys.subtitle') }}</p></div></div>
    <div class="tabs">
      <button class="tab" [class.active]="period() === 'upcoming'" (click)="setPeriod('upcoming')">{{ i18n.t('mys.upcoming') }}</button>
      <button class="tab" [class.active]="period() === 'past'" (click)="setPeriod('past')">{{ i18n.t('mys.past') }}</button>
    </div>
    <div class="filters">
      <input class="input search" [(ngModel)]="search" (keyup.enter)="load(1)" [placeholder]="i18n.t('mys.searchPh')" />
      <button class="btn btn-dark btn-sm" (click)="load(1)">{{ i18n.t('common.search') }}</button>
    </div>
    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (data().items.length === 0) {
      <app-empty [text]="i18n.t('mys.none')" />
    } @else {
      <div class="stack">
        @for (s of data().items; track s.id) {
          <article class="card sess" [class.cancelled]="s.isCancelled">
            <div class="when">
              <b>{{ s.startsAt | sdate: 'date' }}</b>
              <span>{{ s.startsAt | sdate: 'time' }} — {{ s.endsAt | sdate: 'time' }}</span>
            </div>
            <div class="grow">
              <div class="row"><span class="badge b-gold">{{ i18n.name(s.programType) }}</span><span class="small muted">{{ i18n.name(s.program) }}</span>
                @if (s.isCancelled) { <span class="badge b-red">{{ i18n.t('status.cancelled') }}</span> }</div>
              <h3>{{ i18n.pick(s.topicAr, s.topicEn) }}</h3>
            </div>
            <div class="row">
              @if (s.meetingUrl && !s.isCancelled) { <a class="btn btn-primary btn-sm" [href]="s.meetingUrl" target="_blank" rel="noopener"><app-icon name="video" [size]="16" /> {{ i18n.t('mys.join') }}</a> }
              <a class="btn btn-outline btn-sm" [routerLink]="['/app/sessions', s.id]" [state]="{ title: i18n.pick(s.topicAr, s.topicEn) }">{{ i18n.t('sessions.manage') }}</a>
            </div>
          </article>
        }
      </div>
      <app-pagination [page]="data().pageNumber" [totalPages]="data().totalPages" (pageChange)="load($event)" />
    }
  `,
  styles: `
    .sess { display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap; padding: 1.1rem 1.4rem; }
    .sess.cancelled { opacity: 0.6; background: var(--cream-100); }
    .sess h3 { margin: 0.35rem 0 0; }
    .when { display: flex; flex-direction: column; min-width: 150px; padding-inline-end: 1.2rem; border-inline-end: 3px solid var(--gold-500); }
    .when b { font-family: var(--font-display); font-size: 1.15rem; }
    .when span { font-size: 0.85rem; color: var(--muted); }
  `,
})
export class MySessionsPage implements OnInit {
  readonly i18n = inject(I18n);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly period = signal<'upcoming' | 'past'>('upcoming');
  readonly data = signal<Paged<MySession>>({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  readonly loading = signal(true);
  search = '';

  ngOnInit(): void {
    this.load(1);
  }

  setPeriod(period: 'upcoming' | 'past'): void {
    this.period.set(period);
    this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      this.data.set((await this.api.get<Paged<MySession>>('/sessions/mine', { period: this.period(), pageNumber: page, pageSize: 10, search: this.search.trim() })).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }
}

// ───────────────────────── Session hub (attendance / materials / ratings) ─────────────────────────
type HubTab = 'attendance' | 'materials' | 'ratings' | 'rate';

@Component({
  selector: 'app-session-hub',
  imports: [FormsModule, RouterLink, DecimalPipe, EmptyComponent, StarsComponent, FieldComponent, SaudiDatePipe],
  template: `
    <a [routerLink]="backLink()" class="small bold">{{ i18n.isAr() ? '→' : '←' }} {{ i18n.t('common.back') }}</a>
    <div class="page-head mt-1">
      <div>
        <h1>{{ title() || i18n.t('hub.session') + ' #' + id() }}</h1>
        <p>{{ i18n.t('hub.subtitle') }}</p>
      </div>
    </div>

    <div class="tabs">
      @if (canAttendance()) { <button class="tab" [class.active]="tab() === 'attendance'" (click)="open('attendance')">{{ i18n.t('hub.attendance') }}</button> }
      @if (canMaterials()) { <button class="tab" [class.active]="tab() === 'materials'" (click)="open('materials')">{{ i18n.t('hub.materials') }}</button> }
      @if (canRatings()) { <button class="tab" [class.active]="tab() === 'ratings'" (click)="open('ratings')">{{ i18n.t('hub.ratings') }}</button> }
      @if (auth.can('Ratings.Submit')) { <button class="tab" [class.active]="tab() === 'rate'" (click)="open('rate')">{{ i18n.t('hub.rate') }}</button> }
    </div>

    @switch (tab()) {
      @case ('attendance') {
        @if (loading()) {
          <div class="loading-block"><span class="spinner"></span></div>
        } @else if (attendance().length === 0) {
          <app-empty [text]="i18n.t('hub.noParticipants')" />
        } @else {
          <div class="row between mb-2">
            <span class="muted small">{{ i18n.t('hub.attHint') }}</span>
            <div class="row">
              <button class="btn btn-ghost btn-sm" (click)="markAll(true)">{{ i18n.t('hub.allPresent') }}</button>
              <button class="btn btn-ghost btn-sm" (click)="markAll(false)">{{ i18n.t('hub.allAbsent') }}</button>
              <button class="btn btn-primary btn-sm" (click)="saveAttendance()" [disabled]="busy()">{{ i18n.t('common.save') }}</button>
            </div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>{{ i18n.t('f.name') }}</th><th>{{ i18n.t('hub.presence') }}</th><th>{{ i18n.t('hub.editReason') }}</th></tr></thead>
              <tbody>
                @for (row of attendance(); track row.enrollmentId; let i = $index) {
                  <tr>
                    <td><b>{{ i18n.pick(row.fullNameAr, row.fullNameEn) }}</b></td>
                    <td>
                      <div class="seg">
                        <button type="button" [class.on]="row.isPresent === true" class="yes" (click)="setPresence(i, true)">{{ i18n.t('hub.present') }}</button>
                        <button type="button" [class.on]="row.isPresent === false" class="no" (click)="setPresence(i, false)">{{ i18n.t('hub.absent') }}</button>
                      </div>
                    </td>
                    <td><input class="input" [(ngModel)]="row.editReason" [placeholder]="i18n.t('common.optional')" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
      @case ('materials') {
        @if (canUpload()) {
          <div class="card mb-3">
            <h3>{{ i18n.t('hub.addMaterial') }}</h3>
            <div class="form-grid">
              <app-field [label]="i18n.t('hub.matTitle')"><input class="input" [(ngModel)]="matTitle" maxlength="200" /></app-field>
              <app-field [label]="i18n.t('hub.matUrl')" [hint]="i18n.t('hint.https')"><input class="input ltr" [(ngModel)]="matUrl" placeholder="https://..." /></app-field>
            </div>
            <label class="check mb-2"><input type="checkbox" [(ngModel)]="matRecording" /> {{ i18n.t('hub.isRecording') }}</label>
            <button class="btn btn-primary btn-sm" (click)="addMaterial()" [disabled]="busy() || !matTitle.trim() || !httpsOk()">{{ i18n.t('common.add') }}</button>
          </div>
        }
        @if (loading()) {
          <div class="loading-block"><span class="spinner"></span></div>
        } @else if (materials().length === 0) {
          <app-empty [text]="i18n.t('hub.noMaterials')" />
        } @else {
          <div class="stack">
            @for (m of materials(); track m.id) {
              <div class="card row between">
                <div>
                  <b>{{ m.title }}</b>
                  <div class="xs muted">{{ m.typeNameAr }} · {{ m.createdAt | sdate: 'date' }}</div>
                </div>
                <div class="row">
                  @if (m.url) { <a class="btn btn-outline btn-sm" [href]="m.url" target="_blank" rel="noopener">{{ i18n.t('hub.open') }}</a> }
                  @if (auth.can('Materials.Delete')) { <button class="btn btn-ghost btn-sm" (click)="removeMaterial(m)">{{ i18n.t('common.delete') }}</button> }
                </div>
              </div>
            }
          </div>
        }
      }
      @case ('ratings') {
        @if (loading()) {
          <div class="loading-block"><span class="spinner"></span></div>
        } @else if (ratings(); as r) {
          <div class="card avg">
            <b class="big">{{ r.averageRating | number: '1.1-1' }}</b>
            <div><app-stars [value]="roundedAvg()" [size]="26" /><div class="small muted">{{ i18n.t('hub.totalRatings', { n: r.totalRatings }) }}</div></div>
          </div>
          @if (r.ratings.length === 0) {
            <app-empty [text]="i18n.t('hub.noRatings')" />
          } @else {
            <div class="stack mt-2">
              @for (x of r.ratings; track x.id) {
                <div class="card">
                  <div class="row between"><app-stars [value]="x.stars" [size]="18" /><span class="xs muted">{{ x.createdAt | sdate }}</span></div>
                  @if (x.traineeName) { <div class="small bold mt-1">{{ x.traineeName }}</div> }
                  @if (x.note) { <p class="mt-1 mb-0">{{ x.note }}</p> }
                </div>
              }
            </div>
          }
        }
      }
      @case ('rate') {
        <div class="card" style="max-width:520px">
          <h3>{{ i18n.t('hub.rateTitle') }}</h3>
          <p class="muted small">{{ i18n.t('hub.rateText') }}</p>
          <app-stars [(value)]="myStars" [editable]="true" [size]="36" />
          <div class="field mt-2"><textarea class="textarea" [(ngModel)]="myNote" maxlength="1000" [placeholder]="i18n.t('booking.feedback')"></textarea></div>
          <button class="btn btn-primary" (click)="submitRating()" [disabled]="busy() || myStars() < 1">{{ i18n.t('booking.sendRating') }}</button>
        </div>
      }
    }
  `,
  styles: `
    .seg { display: inline-flex; border: 1.5px solid var(--line); border-radius: 999px; overflow: hidden; }
    .seg button { border: 0; background: #fff; padding: 0.35rem 1rem; font-weight: 700; cursor: pointer; font-family: inherit; color: var(--muted); }
    .seg .yes.on { background: var(--green); color: #fff; } .seg .no.on { background: var(--red); color: #fff; }
    .avg { display: flex; align-items: center; gap: 1.5rem; max-width: 380px; }
    .big { font-family: var(--font-display); font-size: 3.6rem; line-height: 1; color: var(--rose-600); }
    .mb-0 { margin-bottom: 0; }
  `,
})
export class SessionHubPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly title = signal((history.state?.title as string) ?? '');
  readonly tab = signal<HubTab>('attendance');
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly attendance = signal<AttendanceItem[]>([]);
  readonly materials = signal<MaterialItem[]>([]);
  readonly ratings = signal<RatingSummary | null>(null);

  readonly canAttendance = computed(() => this.auth.can('Attendance.RecordOwn', 'Attendance.RecordAny'));
  readonly canMaterials = computed(() => this.auth.can('Materials.View', 'Materials.UploadOwn', 'Materials.UploadAny'));
  readonly canUpload = computed(() => this.auth.can('Materials.UploadOwn', 'Materials.UploadAny'));
  readonly canRatings = computed(() => this.auth.can('Ratings.ViewOwn', 'Ratings.ViewAll'));
  readonly roundedAvg = computed(() => Math.round(this.ratings()?.averageRating ?? 0));
  readonly backLink = computed(() => (this.auth.can('Sessions.ViewOwn') && !this.auth.can('Programs.View') ? '/app/my-sessions' : '/app/dashboard'));

  readonly myStars = signal(0);
  myNote = '';
  matTitle = '';
  matUrl = '';
  matRecording = false;

  ngOnInit(): void {
    const first: HubTab = this.canAttendance() ? 'attendance' : this.canMaterials() ? 'materials' : this.canRatings() ? 'ratings' : 'rate';
    this.open(first);
  }

  httpsOk(): boolean {
    return PATTERNS.https.test(this.matUrl);
  }

  async open(tab: HubTab): Promise<void> {
    this.tab.set(tab);
    if (tab === 'rate') {
      return;
    }
    this.loading.set(true);
    try {
      if (tab === 'attendance') {
        this.attendance.set((await this.api.get<AttendanceItem[]>(`/sessions/${this.id()}/attendance`)).data);
      } else if (tab === 'materials') {
        this.materials.set((await this.api.get<MaterialItem[]>(`/sessions/${this.id()}/materials`)).data);
      } else {
        this.ratings.set((await this.api.get<RatingSummary>(`/sessions/${this.id()}/ratings`)).data);
      }
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  setPresence(index: number, present: boolean): void {
    this.attendance.update((list) => list.map((row, i) => (i === index ? { ...row, isPresent: present } : row)));
  }

  markAll(present: boolean): void {
    this.attendance.update((list) => list.map((row) => ({ ...row, isPresent: present })));
  }

  async saveAttendance(): Promise<void> {
    const records = this.attendance()
      .filter((row) => row.isPresent !== null)
      .map((row) => ({ enrollmentId: row.enrollmentId, isPresent: row.isPresent as boolean, editReason: row.editReason?.trim() || null }));
    if (records.length === 0) {
      return;
    }
    this.busy.set(true);
    try {
      await this.api.put(`/sessions/${this.id()}/attendance`, { records });
      this.toast.success(this.i18n.t('common.saved'));
      await this.open('attendance');
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async addMaterial(): Promise<void> {
    this.busy.set(true);
    try {
      await this.api.post(`/sessions/${this.id()}/materials`, { title: this.matTitle.trim(), url: this.matUrl.trim(), isRecording: this.matRecording });
      this.toast.success(this.i18n.t('common.saved'));
      this.matTitle = '';
      this.matUrl = '';
      this.matRecording = false;
      await this.open('materials');
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async removeMaterial(material: MaterialItem): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('common.delete'),
      message: this.i18n.t('hub.deleteMaterial'),
      confirmLabel: this.i18n.t('common.delete'),
      cancelLabel: this.i18n.t('common.back'),
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await this.api.delete(`/materials/${material.id}`);
      this.toast.success(this.i18n.t('common.done'));
      await this.open('materials');
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    }
  }

  async submitRating(): Promise<void> {
    this.busy.set(true);
    try {
      await this.api.post(`/sessions/${this.id()}/ratings`, { stars: this.myStars(), note: this.myNote.trim() || null });
      this.toast.success(this.i18n.t('common.done'));
      this.myStars.set(0);
      this.myNote = '';
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
