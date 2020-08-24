import { Injectable } from "@angular/core";
import { timer } from "rxjs";
import { scan, takeWhile } from "rxjs/operators/";

export interface TimerStep {
  value: number;
  ticked: boolean;
}

@Injectable({
  providedIn: "root",
})
export class TimerService {
  private steps: TimerStep[] = [];

  initialize(value: number) {
    this.steps = [...Array((value || 0) + 1).keys()].reverse().map((key) => {
      return { value: key, ticked: false };
    });

    return this.steps;
  }

  tick() {
    return timer(0, 1000).pipe(
      scan((second) => --second, this.steps.length),
      takeWhile((second) => second >= 0)
    );
  }
}
