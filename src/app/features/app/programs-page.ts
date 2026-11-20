import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { fromSaudiInput } from '../../core/date';
import { applyServerErrors, noBlank } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { Paged, ProgramListItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmptyComponent, FieldComponent, ModalComponent, PaginationComponent, SaudiDatePipe, StateBadgeComponent } from '../../shared/ui';

@Component({
  selector: 'app-programs-page',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, ModalComponent, FieldComponent, PaginationComponent, EmptyComponent, SaudiDatePipe, StateBadgeComponent],
  template: `
    <div class="page-head">
      <div><h1>{{ i18n.t('programs.title') }}</h1><p>{{ i18n.t('programs.subtitle') }}</p></div>
      @if (auth.can('Programs.Create')) {
        <button class="btn btn-primary" (click)="openCreate()">+ {{ i18n.t('programs.add') }}</button>
      }
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
      <app-empty [text]="i18n.t('programs.none')" />
    } @else {
      <div class="grid grid-auto">
        @for (p of data().items; track p.id) {
          <a class="card card-hover prog" [routerLink]="['/app/programs', p.id]">
            <div class="row between">
              <app-state-badge [code]="p.state.code" [label]="i18n.pick(p.state.nameAr, p.state.nameEn)" />
              <span class="badge">{{ i18n.name(p.status) }}</span>
            </div>
            <h3>{{ i18n.pick(p.nameAr, p.nameEn) }}</h3>
            <div class="seats">
              <div class="progress"><span [style.width.%]="p.seats ? (p.state.acceptedCount / p.seats) * 100 : 0"></span></div>
              <span class="xs muted">{{ i18n.t('programs.seatsOf', { a: p.state.acceptedCount, b: p.seats }) }}</span>
            </div>
            <div class="small muted">
              {{ i18n.t('programs.sessions', { n: p.sessionsCount }) }}
              @if (p.firstSessionStartsAt) { · {{ p.firstSessionStartsAt | sdate: 'date' }} }
            </div>
          </a>
        }
      </div>
      <app-pagination [page]="data().pageNumber" [totalPages]="data().totalPages" (pageChange)="load($event)" />
    }

    <app-modal [open]="createOpen()" [title]="i18n.t('programs.add')" [wide]="true" (closed)="createOpen.set(false)">
      <form [formGroup]="form" (ngSubmit)="create()" id="programForm" novalidate>
        @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
        <div class="form-grid">
          <app-field [label]="i18n.t('f.nameAr')" [control]="form.controls.nameAr"><input class="input" formControlName="nameAr" /></app-field>
          <app-field [label]="i18n.t('f.nameEn')" [control]="form.controls.nameEn"><input class="input ltr" formControlName="nameEn" /></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descAr')" [control]="form.controls.descriptionAr"><textarea class="textarea" formControlName="descriptionAr"></textarea></app-field>
          <app-field class="span-2" [label]="i18n.t('f.descEn')" [control]="form.controls.descriptionEn"><textarea class="textarea ltr" formControlName="descriptionEn"></textarea></app-field>
          <app-field [label]="i18n.t('f.seats')" [control]="form.controls.seats"><input class="input" type="number" min="1" max="1000" formControlName="seats" /></app-field>
          <app-field [label]="i18n.t('f.closesAt')" [control]="form.controls.registrationClosesAt" [hint]="i18n.t('hint.saudiTime')"><input class="input" type="datetime-local" formControlName="registrationClosesAt" /></app-field>
        </div>
      </form>
      <div footer class="contents">
        <button class="btn btn-ghost" type="button" (click)="createOpen.set(false)">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-primary" type="submit" form="programForm" [disabled]="busy()">{{ i18n.t('common.create') }}</button>
      </div>
    </app-modal>
  `,
  styles: `
    .prog { display: flex; flex-direction: column; gap: 0.7rem; color: var(--ink); }
    .prog h3 { margin: 0; min-height: 2.6em; }
  `,
})
export class ProgramsPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly data = signal<Paged<ProgramListItem>>({ items: [], pageNumber: 1, pageSize: 9, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  readonly loading = signal(true);
  readonly createOpen = signal(false);
  readonly busy = signal(false);
  readonly formError = signal('');
  search = '';
  statusId: number | null = null;

  readonly form = this.fb.group({
    nameAr: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    nameEn: ['', [Validators.required, Validators.maxLength(200), noBlank]],
    descriptionAr: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    descriptionEn: ['', [Validators.required, Validators.maxLength(4000), noBlank]],
    seats: [30, [Validators.required, Validators.min(1), Validators.max(1000)]],
    registrationClosesAt: [''],
  });

  ngOnInit(): void {
    this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.api.get<Paged<ProgramListItem>>('/programs', { pageNumber: page, pageSize: 9, search: this.search.trim(), statusId: this.statusId });
      this.data.set(response.data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.form.reset({ seats: 30, registrationClosesAt: '' });
    this.formError.set('');
    this.createOpen.set(true);
  }

  async create(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      const value = this.form.getRawValue();
      const response = await this.api.post<{ id: number }>('/programs', { ...value, registrationClosesAt: fromSaudiInput(value.registrationClosesAt) });
      this.toast.success(this.i18n.t('programs.created'));
      this.createOpen.set(false);
      await this.router.navigate(['/app/programs', response.data.id]);
    } catch (error) {
      applyServerErrors(this.form, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
