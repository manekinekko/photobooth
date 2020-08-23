import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { TimerStep } from "./timer.service";
import { TimerState, InitializeTimer } from "./store/timer.state";

@Component({
  selector: "app-timer",
  template: `
    <ul>
      <li *ngFor="let step of steps" [class.ticked]="step.ticked">
        <b *ngIf="step.value != 0; else showCameraIconTpl">{{ step.value }}</b>
        <ng-template #showCameraIconTpl>
          <img *ngIf="step.value == 0" src="assets/camera-invert.png" width="64" height="64" />
        </ng-template>
      </li>
    </ul>
  `,
  styles: [
    `
      :host {
        font-family: sans-serif;
        background: red;
        color: white;
        display: flex;
        justify-content: center;
        font-size: 1.8em;
      }
      ul {
        display: flex;
        flex-direction: row;
        padding: 0;
        margin: 5px;
        justify-content: center;
        height: auto;
      }
      li {
        display: flex;
        padding: 10px;
        align-items: center;
        opacity: 0.5;
        transition: all 100ms ease-in-out;
        transform: scale(0.9);
      }
      li.ticked {
        opacity: 1;
        animation: tick;
        animation-duration: 200ms;
        animation-iteration-count: 1;
        animation-timing-function: ease-in-out;
      }
      @keyframes tick {
        90% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
  ],
})
export class TimerComponent implements OnInit {
  @Output() onTimerEnd: EventEmitter<void>;
  @Input() value = 3;
  steps: TimerStep[];

  @Select(TimerState.steps) timerSteps$: Observable<TimerStep[]>;

  constructor(private store: Store) {
    this.onTimerEnd = new EventEmitter<void>();
    this.timerSteps$.subscribe((steps) => {
      this.steps = steps;
    });
  }

  ngOnInit(): void {
    this.store.dispatch(new InitializeTimer(this.value));
  }
}
