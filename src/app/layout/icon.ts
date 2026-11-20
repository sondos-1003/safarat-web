import { Component, computed, input } from '@angular/core';

const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  users: 'M15 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM4 20c0-3.5 3.6-5.5 8-5.5s8 2 8 5.5',
  book: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5zM6 18h13v3H6',
  flask: 'M9 3h6M10 3v6l-5.5 10a1.6 1.6 0 0 0 1.4 2.3h12.2a1.6 1.6 0 0 0 1.4-2.3L14 9V3M7.5 15h9',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5 5-2z',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4',
  video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3',
  key: 'M8 15a4 4 0 1 1 3.9-4.9L21 10v4h-3v3h-3v-3h-3.1A4 4 0 0 1 8 15z',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  check: 'M5 12l5 5L20 7',
  plus: 'M12 5v14M5 12h14',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  pin: 'M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  ticket: 'M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4zM14 7v12',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  x: 'M6 6l12 12M18 6L6 18',
  user: 'M16 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21c0-4 4-6 8-6s8 2 8 6',
};

@Component({
  selector: 'app-icon',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `:host { display: inline-flex; vertical-align: middle; }`,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
  readonly path = computed(() => PATHS[this.name()] ?? PATHS['star']);
}
