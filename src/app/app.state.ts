import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";

// actions

export class IframeMessage {
  static readonly type = "[Iframe] dispatch message";
  constructor(public readonly data: string) {}
}

// state
export interface AppStateModel {
  lastCapturedPicture: string;
}

@State<AppStateModel>({
  name: "app",
  defaults: {
    lastCapturedPicture: null,
  },
})
@Injectable()
export class AppState {
  constructor() {}

  @Action(IframeMessage)
  initializeTimer({ patchState }: StateContext<AppStateModel>, payload: IframeMessage) {
    patchState({
      lastCapturedPicture: payload.data,
    });

    window.parent.postMessage(
      {
        picture: payload.data,
      },
      "*"
    );
  }
}
