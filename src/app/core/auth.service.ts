import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthResponse, AuthUser } from './models';

const STORAGE_KEY = 'safarat.session';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  mustChangePassword: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private refreshing: Promise<boolean> | null = null;

  private readonly session = signal<StoredSession | null>(this.load());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.session()?.refreshToken ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly mustChangePassword = computed(() => this.session()?.mustChangePassword ?? false);
  readonly roleCode = computed(() => this.user()?.roleCode ?? '');
  readonly isAdmin = computed(() => this.roleCode() === 'Admin');
  private readonly permissionSet = computed(() => new Set(this.user()?.permissions ?? []));

  can(...codes: string[]): boolean {
    if (codes.length === 0) {
      return true;
    }
    const set = this.permissionSet();
    return codes.some((code) => set.has(code));
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', { email, password });
    this.store(response.data);
    return response.data;
  }

  async refresh(): Promise<boolean> {
    if (this.refreshing) {
      return this.refreshing;
    }
    const token = this.refreshToken();
    if (!token) {
      return false;
    }
    this.refreshing = this.api
      .post<AuthResponse>('/auth/refresh', { refreshToken: token })
      .then((response) => {
        this.store(response.data);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  store(auth: AuthResponse): void {
    const next: StoredSession = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
      mustChangePassword: auth.mustChangePassword,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.session.set(next);
  }

  markPasswordChangeRequired(): void {
    const current = this.session();
    if (current && !current.mustChangePassword) {
      this.store({ ...current, mustChangePassword: true } as unknown as AuthResponse);
    }
    this.router.navigateByUrl('/change-password');
  }

  async logout(): Promise<void> {
    const token = this.refreshToken();
    if (token) {
      try {
        await this.api.post('/auth/logout', { refreshToken: token });
      } catch {
        // ignored: the local session is cleared regardless
      }
    }
    this.clear();
    await this.router.navigateByUrl('/');
  }

  expire(): void {
    if (!this.isLoggedIn()) {
      return;
    }
    this.clear();
    this.router.navigateByUrl('/login');
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}
