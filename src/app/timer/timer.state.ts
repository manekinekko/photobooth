import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { patch, updateItem } from "@ngxs/store/operators";
import { TimerService, TimerStep } from "./timer.service";

// actions
export class StartTimer {
  static readonly type = "[Timer] start";
}

export class StopTimer {
  static readonly type = "[Timer] stop";
}

export class InitializeTimer {
  static readonly type = "[Timer] initialize";
  constructor(public readonly value: number) {}
}

export class TickTimer {
  static readonly type = "[Timer] tick";
  constructor(public readonly time: number) {}
}

export class ResetTimer {
  static readonly type = "[Timer] reset";
}

// state
export interface TimerStateModel {
  isTicking: boolean;
  value: number;
  steps: TimerStep[];
}

@State<TimerStateModel>({
  name: "timer",
  defaults: {
    isTicking: false,
    value: 0,
    steps: [],
  },
})
@Injectable()
export class TimerState {
  constructor(private timer: TimerService) {}

  @Selector()
  static isTicking(timer: TimerStateModel) {
    return timer.isTicking;
  }

  @Selector()
  static steps(timer: TimerStateModel) {
    return timer.steps;
  }

  @Action(InitializeTimer)
  initializeTimer({ patchState }: StateContext<TimerStateModel>, payload: InitializeTimer) {
    patchState({
      steps: this.timer.initialize(payload.value),
      value: payload.value,
    });
  }

  @Action(StartTimer)
  startTimer({ patchState, setState, dispatch }: StateContext<TimerStateModel>) {
    patchState({
      isTicking: true,
    });

    this.timer.tick().subscribe(
      (time) => {
        // update state for each tick
        setState(
          patch({
            steps: updateItem<TimerStep>((step) => step.value === time, {
              ticked: true,
              value: time,
            }),
          })
        );

        dispatch(new TickTimer(time));
      },
      (error) => {},
      () => {
        dispatch([new StopTimer(), new ResetTimer()]);
      }
    );
  }

  @Action(StopTimer)
  stopTimer({ patchState }: StateContext<TimerStateModel>) {
    patchState({
      isTicking: false,
    });
  }

  @Action(TickTimer)
  tickTimer() {}

  @Action(ResetTimer)
  resetTimer({ getState, dispatch }: StateContext<TimerStateModel>) {
    dispatch(new InitializeTimer(getState().value));
  }
}
