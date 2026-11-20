import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, FieldError } from './models';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: ApiResponse | null,
  ) {
    super(response?.messageEn ?? 'Network error');
  }

  get messageAr(): string {
    return this.response?.messageAr ?? 'تعذر الاتصال بالخادم، تأكد من تشغيل الـ API';
  }

  get messageEn(): string {
    return this.response?.messageEn ?? 'Cannot reach the server. Make sure the API is running';
  }

  get code(): string | null {
    const data = this.response?.data as { code?: string } | null;
    return data && typeof data === 'object' && !Array.isArray(data) ? (data.code ?? null) : null;
  }

  get fieldErrors(): FieldError[] {
    const data = this.response?.data;
    return Array.isArray(data) ? (data as FieldError[]) : [];
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.call(this.http.get<ApiResponse<T>>(this.base + path, { params: this.toParams(params) }));
  }

  post<T>(path: string, body: unknown = {}): Promise<ApiResponse<T>> {
    return this.call(this.http.post<ApiResponse<T>>(this.base + path, body));
  }

  put<T>(path: string, body: unknown = {}): Promise<ApiResponse<T>> {
    return this.call(this.http.put<ApiResponse<T>>(this.base + path, body));
  }

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.call(this.http.delete<ApiResponse<T>>(this.base + path));
  }

  private async call<T>(request: Observable<ApiResponse<T>>): Promise<ApiResponse<T>> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const body = error.error;
        const isApi = body && typeof body === 'object' && 'success' in body;
        throw new ApiError(error.status, isApi ? (body as ApiResponse) : null);
      }
      throw error;
    }
  }

  private toParams(params?: Record<string, unknown>): HttpParams {
    let result = new HttpParams();
    if (!params) {
      return result;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        result = result.set(key, String(value));
      }
    }
    return result;
  }
}
