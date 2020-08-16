import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";

@Component({
  selector: "app-counter",
  template: `
    <ul>
      <li *ngFor="let step of steps" [class.ticked]="step.ticked">
        <b *ngIf="step.value != 0">{{ step.value }}</b>
        <img *ngIf="step.value == 0" src="assets/camera-invert.png" width="64" height="64" />
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
export class CounterComponent implements OnInit {
  @Output() onCounterEnd: EventEmitter<void>;
  @Input() value = 3;

  steps: { value: number; ticked: boolean }[];

  constructor() {
    this.onCounterEnd = new EventEmitter<void>();
  }

  ngOnInit(): void {
    this.resetCounter();
  }

  async start() {
    this.resetCounter();

    await this.count();

    this.onCounterEnd.emit()
  }

  private resetCounter() {
    this.steps = [...Array(this.value + 1).keys()].reverse().map((key) => {
      return { value: key, ticked: false };
    });
  }

  private async count() {
    return new Promise((resolve) => {
      let counter = 0;
      let timer = setInterval((_) => {
        if (counter >= this.value || !this.steps[counter]) {
          clearInterval(timer);
          resolve();
        }

        this.steps[counter++].ticked = true;
      }, 800);
    });
  }
}
