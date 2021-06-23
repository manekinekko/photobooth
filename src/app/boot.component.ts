import { Component } from "@angular/core";
import { ScreenContext } from 'ngx-foldable';

@Component({
  selector: 'app-boot',
  template: `
    <app-root *ngIf="!isMultiScreen" ></app-root>
    <app-foldable *ngIf="isMultiScreen" ></app-foldable>
  `,
  styles: [`
    app-root {
      margin-top: 40px;
    }
    app-foldable {
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
  `]
})
export class BootComponent {
  isMultiScreen = false;

  constructor(private screenContext: ScreenContext) {
    this.screenContext
      .asObservable()
      .subscribe({
        next: (context) => {
          this.isMultiScreen = context.isMultiScreen;
        }
      });
  }
}