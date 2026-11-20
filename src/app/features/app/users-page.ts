import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { PATTERNS, applyServerErrors, noBlank, patternValidator } from '../../core/forms';
import { I18n } from '../../core/i18n.service';
import { Lookup, Paged, UserDetails, UserListItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmptyComponent, FieldComponent, ModalComponent, PaginationComponent, SaudiDatePipe } from '../../shared/ui';

type Mode = 'view' | 'edit' | 'role' | 'reset';

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, ModalComponent, FieldComponent, PaginationComponent, EmptyComponent, SaudiDatePipe],
  template: `
    <div class="page-head">
      <div><h1>{{ i18n.t('users.title') }}</h1><p>{{ i18n.t('users.subtitle') }}</p></div>
      @if (auth.can('Users.Create')) {
        <button class="btn btn-primary" (click)="openCreate()">+ {{ i18n.t('users.add') }}</button>
      }
    </div>

    <div class="filters">
      <input class="input search" [(ngModel)]="search" (keyup.enter)="reload()" [placeholder]="i18n.t('users.searchPh')" />
      <select class="select" [(ngModel)]="roleId" (change)="reload()">
        <option [ngValue]="null">{{ i18n.t('users.allRoles') }}</option>
        @for (role of roles(); track role.id) { <option [ngValue]="role.id">{{ i18n.name(role) }}</option> }
      </select>
      <select class="select" [(ngModel)]="cityId" (change)="reload()">
        <option [ngValue]="null">{{ i18n.t('users.allCities') }}</option>
        @for (city of cities(); track city.id) { <option [ngValue]="city.id">{{ i18n.name(city) }}</option> }
      </select>
      <select class="select" [(ngModel)]="active" (change)="reload()">
        <option [ngValue]="null">{{ i18n.t('users.allStatus') }}</option>
        <option [ngValue]="true">{{ i18n.t('users.active') }}</option>
        <option [ngValue]="false">{{ i18n.t('users.suspended') }}</option>
      </select>
      <button class="btn btn-dark btn-sm" (click)="reload()">{{ i18n.t('common.search') }}</button>
    </div>

    @if (loading()) {
      <div class="loading-block"><span class="spinner"></span></div>
    } @else if (data().items.length === 0) {
      <app-empty [text]="i18n.t('users.none')" />
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>{{ i18n.t('f.name') }}</th><th>{{ i18n.t('f.email') }}</th><th>{{ i18n.t('f.role') }}</th>
            <th>{{ i18n.t('f.city') }}</th><th>{{ i18n.t('f.status') }}</th><th>{{ i18n.t('users.lastLogin') }}</th>
          </tr></thead>
          <tbody>
            @for (user of data().items; track user.id) {
              <tr class="clickable" (click)="open(user.id)">
                <td><b>{{ displayName(user) }}</b></td>
                <td class="ltr">{{ user.email }}</td>
                <td><span class="badge b-gold">{{ i18n.name(user.role) }}</span></td>
                <td>{{ i18n.name(user.city) }}</td>
                <td>
                  @if (!user.isActive) { <span class="badge b-red">{{ i18n.t('users.suspended') }}</span> }
                  @else if (user.isLocked) { <span class="badge b-amber">{{ i18n.t('users.locked') }}</span> }
                  @else { <span class="badge b-green">{{ i18n.t('users.active') }}</span> }
                </td>
                <td class="small muted">{{ user.lastLoginAt ? (user.lastLoginAt | sdate) : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="data().pageNumber" [totalPages]="data().totalPages" (pageChange)="goto($event)" />
    }

    <!-- Create -->
    <app-modal [open]="createOpen()" [title]="i18n.t('users.add')" [wide]="true" (closed)="createOpen.set(false)">
      <form [formGroup]="createForm" (ngSubmit)="create()" id="createForm" novalidate>
        @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
        <div class="form-grid">
          <app-field [label]="i18n.t('f.firstNameAr')" [control]="createForm.controls.firstNameAr"><input class="input" formControlName="firstNameAr" /></app-field>
          <app-field [label]="i18n.t('f.lastNameAr')" [control]="createForm.controls.lastNameAr"><input class="input" formControlName="lastNameAr" /></app-field>
          <app-field [label]="i18n.t('f.firstNameEn')" [control]="createForm.controls.firstNameEn"><input class="input ltr" formControlName="firstNameEn" /></app-field>
          <app-field [label]="i18n.t('f.lastNameEn')" [control]="createForm.controls.lastNameEn"><input class="input ltr" formControlName="lastNameEn" /></app-field>
          <app-field [label]="i18n.t('f.email')" [control]="createForm.controls.email"><input class="input ltr" type="email" formControlName="email" /></app-field>
          <app-field [label]="i18n.t('f.phone')" [control]="createForm.controls.phoneNumber"><input class="input ltr" formControlName="phoneNumber" placeholder="05XXXXXXXX" /></app-field>
          <app-field [label]="i18n.t('f.city')" [control]="createForm.controls.cityId">
            <select class="select" formControlName="cityId">
              <option [ngValue]="0">{{ i18n.t('common.choose') }}</option>
              @for (city of cities(); track city.id) { <option [ngValue]="city.id">{{ i18n.name(city) }}</option> }
            </select>
          </app-field>
          <app-field [label]="i18n.t('f.role')" [control]="createForm.controls.roleId">
            <select class="select" formControlName="roleId">
              <option [ngValue]="0">{{ i18n.t('common.choose') }}</option>
              @for (role of roles(); track role.id) { <option [ngValue]="role.id">{{ i18n.name(role) }}</option> }
            </select>
          </app-field>
          <app-field class="span-2" [label]="i18n.t('users.tempPassword')" [control]="createForm.controls.password" [hint]="i18n.t('users.tempPasswordHint')">
            <input class="input ltr" type="text" formControlName="password" autocomplete="off" />
          </app-field>
        </div>
      </form>
      <div footer class="contents">
        <button class="btn btn-ghost" type="button" (click)="createOpen.set(false)">{{ i18n.t('common.cancel') }}</button>
        <button class="btn btn-primary" type="submit" form="createForm" [disabled]="busy()">{{ i18n.t('common.create') }}</button>
      </div>
    </app-modal>

    <!-- Details -->
    <app-modal [open]="!!selected()" [title]="selected() ? displayName(selected()!) : ''" [wide]="mode() === 'edit'" (closed)="close()">
      @if (selected(); as user) {
        @switch (mode()) {
          @case ('view') {
            <dl class="kv">
              <dt>{{ i18n.t('f.fullNameAr') }}</dt><dd>{{ user.firstNameAr }} {{ user.lastNameAr }}</dd>
              <dt>{{ i18n.t('f.fullNameEn') }}</dt><dd class="ltr">{{ user.firstNameEn }} {{ user.lastNameEn }}</dd>
              <dt>{{ i18n.t('f.email') }}</dt><dd class="ltr">{{ user.email }} @if (!user.isEmailConfirmed) { <span class="badge b-amber">{{ i18n.t('users.unconfirmed') }}</span> }</dd>
              <dt>{{ i18n.t('f.phone') }}</dt><dd class="ltr">{{ user.phoneNumber }}</dd>
              <dt>{{ i18n.t('f.role') }}</dt><dd><span class="badge b-gold">{{ i18n.name(user.role) }}</span></dd>
              <dt>{{ i18n.t('f.city') }}</dt><dd>{{ i18n.name(user.city) }}</dd>
              <dt>{{ i18n.t('f.status') }}</dt>
              <dd>
                @if (!user.isActive) { <span class="badge b-red">{{ i18n.t('users.suspended') }}</span> }
                @else if (user.isLocked) { <span class="badge b-amber">{{ i18n.t('users.locked') }}</span> }
                @else { <span class="badge b-green">{{ i18n.t('users.active') }}</span> }
                @if (user.mustChangePassword) { <span class="badge b-blue">{{ i18n.t('users.mustChange') }}</span> }
              </dd>
              <dt>{{ i18n.t('users.lastLogin') }}</dt><dd>{{ user.lastLoginAt ? (user.lastLoginAt | sdate) : '—' }}</dd>
              <dt>{{ i18n.t('f.createdAt') }}</dt><dd>{{ user.createdAt | sdate }}</dd>
            </dl>
            <div class="row mt-3">
              @if (auth.can('Users.Edit')) { <button class="btn btn-ghost btn-sm" (click)="startEdit()">{{ i18n.t('common.edit') }}</button> }
              @if (auth.can('Users.ChangeRole')) { <button class="btn btn-ghost btn-sm" (click)="mode.set('role'); newRoleId = user.role.id">{{ i18n.t('users.changeRole') }}</button> }
              @if (auth.can('Users.ManagePermissions')) { <a class="btn btn-ghost btn-sm" [routerLink]="['/app/users', user.id, 'permissions']" (click)="close()">{{ i18n.t('users.permissions') }}</a> }
              @if (auth.can('Users.ResetPassword')) { <button class="btn btn-ghost btn-sm" (click)="mode.set('reset'); resetPassword = ''">{{ i18n.t('users.resetPassword') }}</button> }
              @if (auth.can('Users.Unlock') && user.isLocked) { <button class="btn btn-outline btn-sm" (click)="unlock()">{{ i18n.t('users.unlock') }}</button> }
              @if (auth.can('Users.Suspend')) {
                @if (user.isActive) { <button class="btn btn-danger btn-sm" (click)="suspend()">{{ i18n.t('users.suspend') }}</button> }
                @else { <button class="btn btn-primary btn-sm" (click)="activate()">{{ i18n.t('users.activate') }}</button> }
              }
            </div>
          }
          @case ('edit') {
            <form [formGroup]="editForm" (ngSubmit)="saveEdit()" id="editForm" novalidate>
              @if (formError()) { <div class="alert alert-error mb-2">{{ formError() }}</div> }
              <div class="form-grid">
                <app-field [label]="i18n.t('f.firstNameAr')" [control]="editForm.controls.firstNameAr"><input class="input" formControlName="firstNameAr" /></app-field>
                <app-field [label]="i18n.t('f.lastNameAr')" [control]="editForm.controls.lastNameAr"><input class="input" formControlName="lastNameAr" /></app-field>
                <app-field [label]="i18n.t('f.firstNameEn')" [control]="editForm.controls.firstNameEn"><input class="input ltr" formControlName="firstNameEn" /></app-field>
                <app-field [label]="i18n.t('f.lastNameEn')" [control]="editForm.controls.lastNameEn"><input class="input ltr" formControlName="lastNameEn" /></app-field>
                <app-field [label]="i18n.t('f.email')" [control]="editForm.controls.email"><input class="input ltr" type="email" formControlName="email" /></app-field>
                <app-field [label]="i18n.t('f.phone')" [control]="editForm.controls.phoneNumber"><input class="input ltr" formControlName="phoneNumber" /></app-field>
                <app-field [label]="i18n.t('f.city')" [control]="editForm.controls.cityId">
                  <select class="select" formControlName="cityId">
                    @for (city of cities(); track city.id) { <option [ngValue]="city.id">{{ i18n.name(city) }}</option> }
                  </select>
                </app-field>
              </div>
            </form>
          }
          @case ('role') {
            <app-field [label]="i18n.t('users.newRole')">
              <select class="select" [(ngModel)]="newRoleId">
                @for (role of roles(); track role.id) { <option [ngValue]="role.id">{{ i18n.name(role) }}</option> }
              </select>
            </app-field>
            <div class="alert alert-warn">{{ i18n.t('users.roleWarn') }}</div>
          }
          @case ('reset') {
            <app-field [label]="i18n.t('users.tempPassword')" [hint]="i18n.t('users.tempPasswordHint')">
              <input class="input ltr" [(ngModel)]="resetPassword" autocomplete="off" />
            </app-field>
          }
        }
      }
      <div footer class="contents">
        @if (mode() !== 'view') {
          <button class="btn btn-ghost" (click)="mode.set('view'); formError.set('')">{{ i18n.t('common.back') }}</button>
          @switch (mode()) {
            @case ('edit') { <button class="btn btn-primary" type="submit" form="editForm" [disabled]="busy()">{{ i18n.t('common.save') }}</button> }
            @case ('role') { <button class="btn btn-primary" (click)="saveRole()" [disabled]="busy()">{{ i18n.t('common.save') }}</button> }
            @case ('reset') { <button class="btn btn-primary" (click)="doReset()" [disabled]="busy() || !resetPassword">{{ i18n.t('users.resetPassword') }}</button> }
          }
        }
      </div>
    </app-modal>
  `,
})
export class UsersPage implements OnInit {
  readonly i18n = inject(I18n);
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly data = signal<Paged<UserListItem>>({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  readonly loading = signal(true);
  readonly roles = signal<Lookup[]>([]);
  readonly cities = signal<Lookup[]>([]);
  readonly createOpen = signal(false);
  readonly selected = signal<UserDetails | null>(null);
  readonly mode = signal<Mode>('view');
  readonly busy = signal(false);
  readonly formError = signal('');

  search = '';
  roleId: number | null = null;
  cityId: number | null = null;
  active: boolean | null = null;
  newRoleId = 0;
  resetPassword = '';

  private readonly nameRules = {
    ar: [Validators.required, Validators.maxLength(50), noBlank, patternValidator(PATTERNS.arabicName, 'arabicName')],
    en: [Validators.required, Validators.maxLength(50), noBlank, patternValidator(PATTERNS.englishName, 'englishName')],
  };

  readonly createForm = this.fb.group({
    firstNameAr: ['', this.nameRules.ar],
    lastNameAr: ['', this.nameRules.ar],
    firstNameEn: ['', this.nameRules.en],
    lastNameEn: ['', this.nameRules.en],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, patternValidator(PATTERNS.phone, 'phone')]],
    cityId: [0, [Validators.min(1)]],
    roleId: [0, [Validators.min(1)]],
    password: ['', [Validators.required, patternValidator(PATTERNS.password, 'password')]],
  });

  readonly editForm = this.fb.group({
    firstNameAr: ['', this.nameRules.ar],
    lastNameAr: ['', this.nameRules.ar],
    firstNameEn: ['', this.nameRules.en],
    lastNameEn: ['', this.nameRules.en],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, patternValidator(PATTERNS.phone, 'phone')]],
    cityId: [0, [Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    this.load(1);
    try {
      const [roles, cities] = await Promise.all([this.api.get<Lookup[]>('/lookups/roles'), this.api.get<Lookup[]>('/lookups/cities')]);
      this.roles.set(roles.data);
      this.cities.set(cities.data);
    } catch {
      /* lookups are optional for the list */
    }
  }

  displayName(user: { firstNameAr: string; lastNameAr: string; firstNameEn: string; lastNameEn: string }): string {
    return this.i18n.isAr() ? `${user.firstNameAr} ${user.lastNameAr}` : `${user.firstNameEn} ${user.lastNameEn}`;
  }

  reload(): void {
    this.load(1);
  }

  goto(page: number): void {
    this.load(page);
  }

  private async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.api.get<Paged<UserListItem>>('/users', {
        pageNumber: page,
        pageSize: 10,
        search: this.search.trim(),
        roleId: this.roleId,
        cityId: this.cityId,
        isActive: this.active,
      });
      this.data.set(response.data);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.createForm.reset({ cityId: 0, roleId: 0 });
    this.formError.set('');
    this.createOpen.set(true);
  }

  async create(): Promise<void> {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      await this.api.post('/users', this.createForm.getRawValue());
      this.toast.success(this.i18n.t('users.created'));
      this.createOpen.set(false);
      this.load(1);
    } catch (error) {
      applyServerErrors(this.createForm, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async open(id: number): Promise<void> {
    try {
      const response = await this.api.get<UserDetails>(`/users/${id}`);
      this.selected.set(response.data);
      this.mode.set('view');
      this.formError.set('');
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    }
  }

  close(): void {
    this.selected.set(null);
  }

  startEdit(): void {
    const user = this.selected();
    if (!user) {
      return;
    }
    this.editForm.reset({
      firstNameAr: user.firstNameAr,
      lastNameAr: user.lastNameAr,
      firstNameEn: user.firstNameEn,
      lastNameEn: user.lastNameEn,
      email: user.email,
      phoneNumber: user.phoneNumber,
      cityId: user.city.id,
    });
    this.formError.set('');
    this.mode.set('edit');
  }

  async saveEdit(): Promise<void> {
    const user = this.selected();
    this.editForm.markAllAsTouched();
    if (!user || this.editForm.invalid) {
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      await this.api.put(`/users/${user.id}`, this.editForm.getRawValue());
      this.toast.success(this.i18n.t('common.saved'));
      await this.open(user.id);
      this.load(this.data().pageNumber);
    } catch (error) {
      applyServerErrors(this.editForm, error, this.i18n);
      this.formError.set(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }

  async saveRole(): Promise<void> {
    await this.act(() => this.api.put(`/users/${this.selected()!.id}/role`, { roleId: this.newRoleId }), 'common.saved');
  }

  async doReset(): Promise<void> {
    await this.act(() => this.api.post(`/users/${this.selected()!.id}/reset-password`, { newPassword: this.resetPassword }), 'users.resetDone');
  }

  async unlock(): Promise<void> {
    await this.act(() => this.api.post(`/users/${this.selected()!.id}/unlock`), 'common.done');
  }

  async activate(): Promise<void> {
    await this.act(() => this.api.post(`/users/${this.selected()!.id}/activate`), 'common.done');
  }

  async suspend(): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('users.suspend'),
      message: this.i18n.t('users.suspendConfirm'),
      confirmLabel: this.i18n.t('users.suspend'),
      cancelLabel: this.i18n.t('common.cancel'),
      danger: true,
    });
    if (ok) {
      await this.act(() => this.api.post(`/users/${this.selected()!.id}/suspend`), 'common.done');
    }
  }

  private async act(action: () => Promise<unknown>, successKey: string): Promise<void> {
    const user = this.selected();
    if (!user) {
      return;
    }
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.i18n.t(successKey));
      await this.open(user.id);
      this.load(this.data().pageNumber);
    } catch (error) {
      this.toast.error(this.i18n.error(error));
    } finally {
      this.busy.set(false);
    }
  }
}
