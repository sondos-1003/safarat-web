import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { I18n } from '../../core/i18n.service';
import { BrowseItem, MyEnrollment, Paged, TraineeProgress } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../layout/icon';
import { EmptyComponent, PaginationComponent, SaudiDatePipe, StateBadgeComponent } from '../../shared/ui';

@Component({
  selector: 'app-browse-page',
  imports: [PaginationComponent, EmptyComponent, SaudiDatePipe, StateBadgeComponent, IconComponent],
  template: `
    <div class="page-head"><div><h1>{{ i18n.t('browse.title') }}</h1><p>{{ i18n.t('browse.subtitle') }}</p></div></div>

    @if (canPrograms() && canWorkshops()) {
      <div class="tabs">
        <button class="tab" [class.active]="kind() === 'programs'" (click)="switch('programs')">{{ i18n.t('menu.programs') }}</button>
        <button class="tab" [class.active]="kind() === 'workshops'" (click)="switch('workshops')">{{ i18n.t('menu.workshops') }}</button>
      </div>
    }

    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (data().items.length === 0) {
      <app-empty [text]="i18n.t('browse.none')" />
    } @else {
      <div class="grid grid-auto">
        @for (item of data().items; track item.id) {
          <article class="card card-hover item">
            <div class="row between">
              <app-state-badge [code]="item.state.code" [label]="i18n.pick(item.state.nameAr, item.state.nameEn)" />
              <span class="xs muted">{{ i18n.t('event.seatsLeft', { n: item.remainingSeats }) }}</span>
            </div>
            <h3>{{ i18n.pick(item.nameAr, item.nameEn) }}</h3>
            <p class="desc">{{ i18n.pick(item.descriptionAr, item.descriptionEn) }}</p>
            <div class="small muted stack" style="gap:0.25rem">
              @if (item.firstSessionStartsAt) { <span><app-icon name="calendar" [size]="15" /> {{ item.firstSessionStartsAt | sdate }}</span> }
              @if (item.registrationClosesAt) { <span><app-icon name="clock" [size]="15" /> {{ i18n.t('browse.closes') }}: {{ item.registrationClosesAt | sdate }}</span> }
            </div>
            @if (auth.can('Enrollments.Apply')) {
              <button class="btn btn-primary btn-block mt-2" [disabled]="!item.state.isRegistrationOpen || busyId() === item.id" (click)="apply(item)">
                @if (busyId() === item.id) { <span class="spinner"></span> }
                {{ item.state.isRegistrationOpen ? i18n.t('browse.apply') : i18n.t('browse.closed') }}
              </button>
            }
          </article>
        }
      </div>
      <app-pagination [page]="data().pageNumber" [totalPages]="data().totalPages" (pageChange)="load($event)" />
    }
  `,
  styles: `
    .item { display: flex; flex-direction: column; gap: 0.7rem; }
    .item h3 { margin: 0; }
    .desc { color: var(--muted); font-size: 0.92rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
    app-icon { color: var(--gold-600); }
  `,
})
export class BrowsePage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly canPrograms = computed(() => this.auth.can('Programs.Browse'));
  readonly canWorkshops = computed(() => this.auth.can('Workshops.Browse'));
  readonly kind = signal<'programs' | 'workshops'>('programs');
  readonly data = signal<Paged<BrowseItem>>({ items: [], pageNumber: 1, pageSize: 9, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  readonly loading = signal(true);
  readonly busyId = signal(0);

  ngOnInit(): void {
    this.kind.set(this.canPrograms() ? 'programs' : 'workshops');
    this.load(1);
  }

  switch(kind: 'programs' | 'workshops'): void {
    this.kind.set(kind);
    this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const path = this.kind() === 'programs' ? '/programs/browse' : '/workshops/browse';
      this.data.set((await this.api.get<Paged<BrowseItem>>(path, { pageNumber: page, pageSize: 9 })).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  async apply(item: BrowseItem): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('browse.apply'),
      message: this.i18n.t('browse.applyConfirm', { name: this.i18n.pick(item.nameAr, item.nameEn) }),
      confirmLabel: this.i18n.t('browse.apply'),
      cancelLabel: this.i18n.t('common.cancel'),
    });
    if (!ok) {
      return;
    }
    this.busyId.set(item.id);
    try {
      await this.api.post(`/programs/${item.id}/enrollments`);
      this.toast.success(this.i18n.t('browse.applied'));
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busyId.set(0);
    }
  }
}

@Component({
  selector: 'app-my-enrollments',
  imports: [RouterLink, EmptyComponent, SaudiDatePipe, StateBadgeComponent],
  template: `
    <div class="page-head"><div><h1>{{ i18n.t('myenr.title') }}</h1><p>{{ i18n.t('myenr.subtitle') }}</p></div></div>
    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (items().length === 0) {
      <app-empty [text]="i18n.t('myenr.none')"><a routerLink="/app/browse" class="btn btn-primary btn-sm">{{ i18n.t('menu.browse') }}</a></app-empty>
    } @else {
      <div class="stack">
        @for (e of items(); track e.id) {
          <article class="card item">
            <div class="grow">
              <div class="row">
                <app-state-badge [code]="e.status.code ?? code(e.status.id)" [label]="i18n.name(e.status)" />
                <span class="badge">{{ i18n.name(e.programType) }}</span>
              </div>
              <h3>{{ i18n.pick(e.programNameAr, e.programNameEn) }}</h3>
              <div class="small muted">
                {{ i18n.t('myenr.appliedAt') }}: {{ e.createdAt | sdate: 'date' }}
                @if (e.firstSessionStartsAt) { · {{ i18n.t('programs.firstSession') }}: {{ e.firstSessionStartsAt | sdate }} }
              </div>
              @if (e.reason) { <div class="small mt-1"><b>{{ i18n.t('enr.reason') }}:</b> {{ e.reason }}</div> }
              @if (progressFor(e.programId); as p) {
                <div class="mt-2">
                  <div class="row between small"><span>{{ i18n.t('myenr.progress') }} — {{ p.attendedSessions }}/{{ p.totalSessions }}</span><b>{{ p.attendancePercent }}%</b></div>
                  <div class="progress"><span [style.width.%]="p.attendancePercent"></span></div>
                  @if (p.isCompleted) { <span class="badge b-green mt-1">✓ {{ i18n.t('myenr.completed') }}</span> }
                </div>
              }
            </div>
            @if (auth.can('Enrollments.CancelOwn') && (e.status.id === 1 || e.status.id === 2)) {
              <button class="btn btn-ghost btn-sm" (click)="cancel(e)" [disabled]="busyId() === e.id">{{ i18n.t('myenr.cancel') }}</button>
            }
          </article>
        }
      </div>
    }
  `,
  styles: `.item { display: flex; gap: 1.2rem; align-items: flex-start; flex-wrap: wrap; } .item h3 { margin: 0.5rem 0 0.2rem; }`,
})
export class MyEnrollmentsPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly items = signal<(MyEnrollment & { status: MyEnrollment['status'] & { code?: string } })[]>([]);
  readonly progress = signal<TraineeProgress[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal(0);

  async ngOnInit(): Promise<void> {
    await this.load();
    this.loading.set(false);
    try {
      this.progress.set((await this.api.get<TraineeProgress[]>('/enrollments/mine/progress')).data);
    } catch {
      /* progress is optional */
    }
  }

  code(id: number): string {
    return ['', 'Pending', 'Accepted', 'Rejected', 'CancelledByParticipant', 'Withdrawn'][id] ?? '';
  }

  progressFor(programId: number): TraineeProgress | undefined {
    return this.progress().find((p) => p.programId === programId);
  }

  private async load(): Promise<void> {
    try {
      this.items.set((await this.api.get<MyEnrollment[]>('/enrollments/mine')).data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    }
  }

  async cancel(e: MyEnrollment): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('myenr.cancel'),
      message: this.i18n.t('myenr.cancelConfirm'),
      confirmLabel: this.i18n.t('common.confirm'),
      cancelLabel: this.i18n.t('common.back'),
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busyId.set(e.id);
    try {
      await this.api.post(`/enrollments/${e.id}/cancel`);
      this.toast.success(this.i18n.t('common.done'));
      await this.load();
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busyId.set(0);
    }
  }
}
