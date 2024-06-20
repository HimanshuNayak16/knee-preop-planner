import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EngineComponent } from './engine/engine.component';
import { UiComponent } from './ui/ui.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, EngineComponent, UiComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'knee-preop-planner';
}
