import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-hero',
  standalone: true,
  template: `
    <header class="hero">
      <div class="position-relative" style="z-index: 1;">
        <p class="tracking">{{ eyebrow }}</p>
        <h1 class="display-6 mb-3 text-white">{{ title }}</h1>
        @if (subtitle) {
          <p class="text-muted m-0 mb-4">{{ subtitle }}</p>
        }
        <ng-content />
      </div>
    </header>
  `,
})
export class SectionHeroComponent {
  @Input({ required: true }) eyebrow!: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
}
