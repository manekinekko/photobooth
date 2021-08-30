import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { AppService } from "./app.service";

// actions

export class IframeMessage {
  static readonly type = "[Iframe] dispatch message";
  constructor(public readonly data: string) { }
}

export class SelectStyleTranserImage {
  static readonly type = "[styleTranfer] select transfer style image";
  constructor(public readonly imageStyle: HTMLImageElement) { }
}

export class StyleTranser {
  static readonly type = "[styleTranfer] transfer style";
  constructor(public readonly imageData: HTMLImageElement, public readonly imageStyle: HTMLImageElement, public readonly strength: number = 0.25) { }
}

// state
export interface AppStateModel {
  lastCapturedPicture: string;
}

export interface StyleTransferStateModel {
  imageData: HTMLImageElement
  imageStyle: HTMLImageElement
  strength: number;
}

@State<AppStateModel>({
  name: "app",
  defaults: {
    lastCapturedPicture: null
  },
})
@Injectable()
export class AppState {
  constructor(private readonly appService: AppService) { }

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


  @Action(SelectStyleTranserImage)
  async selectStyleTranserImage({ patchState }: StateContext<StyleTransferStateModel>, payload: StyleTranser) {
    const { imageStyle } = payload;
    patchState({
      imageStyle
    });
  }

  @Action(StyleTranser)
  async styleTranser({ getState }: StateContext<StyleTransferStateModel>, payload: StyleTranser) {
    const {
      imageStyle 
    } = getState();
    const { imageData, strength } = payload;
    await this.appService.styleTransfer(imageData, imageStyle);
  }
}
