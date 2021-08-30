import { Component } from "@angular/core";
import { Select } from "@ngxs/store";
import { ScreenContext } from 'ngx-foldable';
import { Observable } from "rxjs";
import { CameraState } from "./camera/camera.state";

@Component({
  selector: 'app-boot',
  template: `
    <p class="error" *ngIf="!hasSource else app">
      Oh Snap! We can't access your camera.<br />Please check your browser permissions! <br /><br />If you believe we made a mistake, please
      <a href="https://github.com/manekinekko/photobooth">submit an issue</a>.
    </p>
    <ng-template #app>
      <app-root *ngIf="!isMultiScreen" ></app-root>
      <app-foldable *ngIf="isMultiScreen" ></app-foldable>
    </ng-template>
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

    .error {
      transition: 0.3s all;
      color: red;
      font-size: 1em;
      display: inline-block;
      border: 10px solid red;
      padding: 10px 30px;
      border-radius: 4px;
      background: white;
      text-align: center;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      position: absolute;
      top: calc(50% - 100px);
      left: calc(50% - 230px);
      z-index: 1;
      box-shadow: 1px 1px 1px #620000;
    }

    .error a {
      color: red;
    }
    @media (spanning: single-fold-vertical) {	
      .error {
        height: 100px;
        padding: 0;
        padding-top: 10px;
        width: calc(env(fold-left) - 40px);
        position: absolute;
        left: 10px;
        bottom: 0;
      }
    }
    @media (spanning: single-fold-horizontal) {	
      .error {
        height: 100px;
        padding-top: 10px;
        position: absolute;
        top: 100px;
      }
    }
  `]
})
export class BootComponent {
  isMultiScreen = false;
  hasSource = false;

  @Select(CameraState.source) hasSource$: Observable<boolean>;

  constructor(private screenContext: ScreenContext) {
    this.hasSource = null;
    this.hasSource$.subscribe((source) => {
      this.hasSource = !!source;
    });

    this.screenContext
      .asObservable()
      .subscribe({
        next: (context) => {
          this.isMultiScreen = context.isMultiScreen;
        }
      });
  }
}