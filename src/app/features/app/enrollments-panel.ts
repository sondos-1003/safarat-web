import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { I18n } from '../../core/i18n.service';
import { Paged, ProgramEnrollmentItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmptyComponent, FieldComponent, ModalComponent, PaginationComponent, SaudiDatePipe, StateBadgeComponent } from '../../shared/ui';

@Component({
  selector: 'app-enrollments-panel',
  imports: [FormsModule, ModalComponent, FieldComponent, PaginationComponent, EmptyComponent, SaudiDatePipe, StateBadgeComponent],
  template: `
    <div class="filters">
      <input class="input search" [(ngModel)]="search" (keyup.enter)="load(1)" [placeholder]="i18n.t('enr.searchPh')" />
      <select class="select" [(ngModel)]="statusId" (change)="load(1)">
        <option [ngValue]="null">{{ i18n.t('enr.allStatus') }}</option>
        @for (s of statuses; track s) { <option [ngValue]="s">{{ i18n.t('enr.status.' + s) }}</option> }
      </select>
      <button class="btn btn-dark btn-sm" (click)="load(1)">{{ i18n.t('common.search') }}</button>
      <div class="grow"></div>
      @if (selectedIds().length > 0) {
        @if (auth.can('Enrollments.Accept')) {
          <button class="btn btn-primary btn-sm" (click)="accept()" [disabled]="busy()">{{ i18n.t('enr.acceptSelected', { n: selectedIds().length }) }}</button>
        }
        @if (auth.can('Enrollments.Reject')) {
          <button class="btn btn-danger btn-sm" (click)="openReject()" [disabled]="busy()">{{ i18n.t('enr.rejectSelected', { n: selectedIds().length }) }}</button>
        }
      }
    </div>

    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (data().items.length === 0) {
      <app-empty [text]="i18n.t('enr.none')" />
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th></th><th>{{ i18n.t('f.name') }}</th><th>{{ i18n.t('f.email') }} / {{ i18n.t('f.phone') }}</th>
            <th>{{ i18n.t('f.city') }}</th><th>{{ i18n.t('f.status') }}</th><th>{{ i18n.t('enr.appliedAt') }}</th><th></th>
          </tr></thead>
          <tbody>
            @for (item of data().items; track item.id) {
              <tr>
                <td>
                  @if (item.status.id === 1) {
                    <input type="checkbox" class="cb" [checked]="selected().has(item.id)" (change)="toggle(item.id)" />
                  }
                </td>
                <td><b>{{ i18n.pick(item.fullNameAr, item.fullNameEn) }}</b></td>
                <td class="small"><span class="ltr">{{ item.email }}</span><br /><span class="ltr muted">{{ item.phoneNumber }}</span></td>
                <td>{{ i18n.pick(item.cityNameAr, item.cityNameEn) }}</td>
                <td>
                  <app-state-badge [code]="statusCode(item.status.id)" [label]="i18n.name(item.status)" />
                  @if (item.reason) { <div class="xs muted mt-1">{{ item.reason }}</div> }
                </td>
                <td class="small muted">{{ item.createdAt | sdate: 'date' }}</td>
                <td>
                  @if (item.status.id === 2 && auth.can('Enrollments.Withdraw')) {
                    <button class="btn btn-ghost btn-sm" (click)="openWithdraw(item)">{{ i18n.t('enr.withdraw') }}</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="data().pageNumber" [totalPages]="data().totalPages" (pageChange)="load($event)" />
    }

    <app-modal [open]="reasonMode() !== null" [title]="reasonMode() === 'reject' ? i18n.t('enr.rejectTitle') : i18n.t('enr.withdrawTitle')" (closed)="reasonMode.set(null)">
      <app-field [label]="i18n.t('enr.reason')" [hint]="reasonMode() === 'reject' ? i18n.t('common.optional') : ''">
        <textarea class="textarea" [(ngModel)]="reason" maxlength="500"></textarea>
      </app-field>
      <div footer class="contents">
        <button class="btn btn-ghost" (click)="reasonMode.set(null)">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-danger" (click)="submitReason()" [disabled]="busy() || (reasonMode() === 'withdraw' && !reason.trim())">{{ i18n.t('common.confirm') }}</button>
      </div>
    </app-modal>
  `,
  styles: `.cb { width: 18px; height: 18px; accent-color: var(--gold-600); }`,
})
export class EnrollmentsPanel implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly programId = input.required<number>();
  readonly changed = output<void>();

  readonly statuses = [1, 2, 3, 4, 5];
  readonly data = signal<Paged<ProgramEnrollmentItem>>({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly selected = signal(new Set<number>());
  readonly reasonMode = signal<'reject' | 'withdraw' | null>(null);
  readonly selectedIds = () => [...this.selected()];

  search = '';
  statusId: number | null = null;
  reason = '';
  private withdrawTarget: ProgramEnrollmentItem | null = null;

  ngOnInit(): void {
    this.load(1);
  }

  statusCode(id: number): string {
    return ['', 'Pending', 'Accepted', 'Rejected', 'CancelledByParticipant', 'Withdrawn'][id] ?? '';
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    this.selected.set(new Set());
    try {
      const response = await this.api.get<Paged<ProgramEnrollmentItem>>(`/programs/${this.programId()}/enrollments`, {
        pageNumber: page,
        pageSize: 10,
        search: this.search.trim(),
        statusId: this.statusId,
      });
      this.data.set(response.data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  toggle(id: number): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  async accept(): Promise<void> {
    await this.run(() => this.api.post('/enrollments/accept', { enrollmentIds: this.selectedIds() }));
  }

  openReject(): void {
    this.reason = '';
    this.reasonMode.set('reject');
  }

  openWithdraw(item: ProgramEnrollmentItem): void {
    this.withdrawTarget = item;
    this.reason = '';
    this.reasonMode.set('withdraw');
  }

  async submitReason(): Promise<void> {
    const mode = this.reasonMode();
    if (mode === 'reject') {
      await this.run(() => this.api.post('/enrollments/reject', { enrollmentIds: this.selectedIds(), reason: this.reason.trim() || null }));
    } else if (mode === 'withdraw' && this.withdrawTarget) {
      const id = this.withdrawTarget.id;
      await this.run(() => this.api.post(`/enrollments/${id}/withdraw`, { reason: this.reason.trim() }));
    }
    this.reasonMode.set(null);
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.i18n.t('common.done'));
      this.changed.emit();
      await this.load(this.data().pageNumber);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
