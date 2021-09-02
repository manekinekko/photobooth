import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { map, switchMap, tap } from "rxjs/operators";
import { AppService } from "./app.service";
import { CameraRollService } from "./camera-roll/camera-roll.service";
import { CameraRollState, PictureItem } from "./camera-roll/camera-roll.state";
import { PreviewPictureData } from "./camera/camera.state";

// actions

export class IframeMessage {
  static readonly type = "[Iframe] dispatch message";
  constructor(public readonly data: string) { }
}

export class SelectStyleTranserImage {
  static readonly type = "[styleTranfer] select transfer style image";
  constructor(public imageStyle: HTMLImageElement, public strength: number) { }
}

export class StyleTranser {
  static readonly type = "[styleTranfer] transfer style to image";
  constructor(public imageData: HTMLImageElement, public imageStyle: HTMLImageElement, public strength: number) { }
}

export class StyleTranserProcessing {
  static readonly type = "[styleTranfer] transfer style loading state";
  constructor(public status: boolean) { }
}

// state
export interface AppStateModel {
  lastCapturedPicture: string;
  styleTransfer: ImageStyleStateModel;
  styledImageData: ImageData;
  styleTransferProcessingStatus: boolean;
  strength: number;
}

export interface ImageStyleStateModel {
  imageStyle: HTMLImageElement;
  strength: number;

}

export interface StyleTransferStateModel extends ImageStyleStateModel {
  imageData: HTMLImageElement;
}

@State<AppStateModel>({
  name: "app",
  defaults: {
    lastCapturedPicture: null,
    styleTransfer: null,
    styledImageData: null,
    styleTransferProcessingStatus: false,
    strength: 0,
  },
})
@Injectable()
export class AppState {
  constructor(
    private readonly appService: AppService,
    private readonly cameraRollService: CameraRollService,
    private readonly store: Store
  ) { }

  @Selector()
  static styleTransferProcessingStatus(state: AppStateModel) {
    return state.styleTransferProcessingStatus;
  }

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

  @Action(StyleTranserProcessing)
  setStyleTranserProcessingStatus({ patchState }: StateContext<AppStateModel>, payload: StyleTranserProcessing) {
    patchState({
      styleTransferProcessingStatus: payload.status
    });
  }

  @Action(SelectStyleTranserImage)
  async selectStyleTranserImage({ dispatch, patchState }: StateContext<AppStateModel>, payload: SelectStyleTranserImage) {
    const { imageStyle, strength } = payload;

    patchState({
      styleTransfer: {
        imageStyle,
        strength
      }
    });

    const selectedPictureId = this.store.selectSnapshot(CameraRollState.selectedPictureId);
    this.cameraRollService.read(selectedPictureId).pipe(
      map((picture: PictureItem) => picture.data),
      tap((pictureData: string) => {
        if (pictureData) {
          dispatch(new StyleTranserProcessing(true));
          const imageData = new Image();
          imageData.onload = () => {
            dispatch(new StyleTranser(imageData, imageStyle, payload.strength));
          }
          imageData.src = pictureData;
        }
      })
    ).subscribe();
  }

  @Action(StyleTranser)
  async styleTranser({ dispatch }: StateContext<AppStateModel>, payload: StyleTranser) {
    const { imageData, imageStyle, strength } = payload;
    const styledImageData = await this.appService.styleTransfer(imageData, imageStyle, strength);
    this.cameraRollService.save(styledImageData, 'style-transfert-data').pipe(
      switchMap(() => this.cameraRollService.read('style-transfert-data'))
    ).subscribe((entry: PictureItem) => {
      dispatch(new PreviewPictureData(entry.data));
      dispatch(new StyleTranserProcessing(false));
    });

  }
}
