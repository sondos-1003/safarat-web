import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<ConfirmRequest | null>(null);

  ask(options: { title: string; message: string; confirmLabel: string; cancelLabel: string; danger?: boolean }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.current.set({ ...options, danger: options.danger ?? false, resolve });
    });
  }

  answer(value: boolean): void {
    const request = this.current();
    this.current.set(null);
    request?.resolve(value);
  }
}
