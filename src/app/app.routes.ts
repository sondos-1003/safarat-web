import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard, sessionGuard } from './core/guards';
import { AppLayout } from './layout/app-layout';
import { AuthLayout } from './layout/auth-layout';
import { PublicLayout } from './layout/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/public/landing').then((m) => m.LandingPage) },
      { path: 'events', loadComponent: () => import('./features/public/public-pages').then((m) => m.EventsPage) },
      { path: 'events/:id', loadComponent: () => import('./features/public/public-pages').then((m) => m.EventDetailPage) },
      { path: 'booking', loadComponent: () => import('./features/public/public-pages').then((m) => m.BookingPage) },
      { path: 'community', loadComponent: () => import('./features/public/public-pages').then((m) => m.CommunityPage) },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/auth-pages').then((m) => m.LoginPage) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/auth-pages').then((m) => m.RegisterPage) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/auth-pages').then((m) => m.ForgotPasswordPage) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/auth-pages').then((m) => m.ResetPasswordPage) },
      { path: 'confirm-email', loadComponent: () => import('./features/auth/auth-pages').then((m) => m.ConfirmEmailPage) },
      { path: 'change-password', canActivate: [sessionGuard], loadComponent: () => import('./features/auth/auth-pages').then((m) => m.ChangePasswordPage) },
    ],
  },
  {
    path: 'app',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/app/dashboard').then((m) => m.DashboardPage) },
      { path: 'account', loadComponent: () => import('./features/app/account').then((m) => m.AccountPage) },

      { path: 'browse', canActivate: [permissionGuard], data: { permissions: ['Programs.Browse', 'Workshops.Browse'] }, loadComponent: () => import('./features/app/learner').then((m) => m.BrowsePage) },
      { path: 'enrollments', canActivate: [permissionGuard], data: { permissions: ['Enrollments.ViewOwn'] }, loadComponent: () => import('./features/app/learner').then((m) => m.MyEnrollmentsPage) },
      { path: 'my-sessions', canActivate: [permissionGuard], data: { permissions: ['Sessions.ViewOwn'] }, loadComponent: () => import('./features/app/trainer').then((m) => m.MySessionsPage) },
      {
        path: 'sessions/:id',
        canActivate: [permissionGuard],
        data: { permissions: ['Attendance.RecordOwn', 'Attendance.RecordAny', 'Materials.View', 'Materials.UploadOwn', 'Materials.UploadAny', 'Ratings.ViewOwn', 'Ratings.ViewAll', 'Ratings.Submit'] },
        loadComponent: () => import('./features/app/trainer').then((m) => m.SessionHubPage),
      },

      { path: 'programs', canActivate: [permissionGuard], data: { permissions: ['Programs.View'] }, loadComponent: () => import('./features/app/programs-page').then((m) => m.ProgramsPage) },
      { path: 'programs/:id', canActivate: [permissionGuard], data: { permissions: ['Programs.View'] }, loadComponent: () => import('./features/app/program-detail').then((m) => m.ProgramDetailPage) },
      { path: 'workshops', canActivate: [permissionGuard], data: { permissions: ['Workshops.View'] }, loadComponent: () => import('./features/app/workshops').then((m) => m.WorkshopsPage) },
      { path: 'workshops/:id', canActivate: [permissionGuard], data: { permissions: ['Workshops.View'] }, loadComponent: () => import('./features/app/workshops').then((m) => m.WorkshopDetailPage) },
      { path: 'events', canActivate: [permissionGuard], data: { permissions: ['Events.View', 'Events.Create', 'Events.Edit', 'Events.Publish', 'Events.CheckIn'] }, loadComponent: () => import('./features/app/events-admin').then((m) => m.EventsAdminPage) },
      { path: 'users', canActivate: [permissionGuard], data: { permissions: ['Users.View'] }, loadComponent: () => import('./features/app/users-page').then((m) => m.UsersPage) },
      { path: 'users/:id/permissions', canActivate: [permissionGuard], data: { permissions: ['Users.ManagePermissions'] }, loadComponent: () => import('./features/app/user-permissions').then((m) => m.UserPermissionsPage) },
      { path: 'settings', canActivate: [permissionGuard], data: { permissions: ['Settings.View'] }, loadComponent: () => import('./features/app/settings-page').then((m) => m.SettingsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
