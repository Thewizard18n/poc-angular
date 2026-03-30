import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './shared/ui/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
      <router-outlet />
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('poc-angular-moderno');
}
