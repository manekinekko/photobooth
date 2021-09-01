import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { delay, map, switchMap, tap } from "rxjs/operators";
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
  constructor(public imageStyle: HTMLImageElement) { }
}

export class StyleTranser {
  static readonly type = "[styleTranfer] transfer style to image";
  constructor(public imageData: HTMLImageElement, public imageStyle: HTMLImageElement, public strength: number = 0.25) { }
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
}

export interface ImageStyleStateModel {
  imageStyle: HTMLImageElement
}

export interface StyleTransferStateModel extends ImageStyleStateModel {
  imageData: HTMLImageElement
  strength: number;
}

@State<AppStateModel>({
  name: "app",
  defaults: {
    lastCapturedPicture: null,
    styleTransfer: null,
    styledImageData: null,
    styleTransferProcessingStatus: false
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
  async selectStyleTranserImage({ dispatch, patchState }: StateContext<AppStateModel>, payload: ImageStyleStateModel) {
    const { imageStyle } = payload;
    patchState({
      styleTransfer: {
        imageStyle,
      }
    });

    const selectedPictureId = this.store.selectSnapshot(CameraRollState.selectedPictureId);
    this.cameraRollService.read(selectedPictureId).pipe(
      map((picture: PictureItem) => picture.data),
      tap((pictureData: string) => {
        if (pictureData) {
          const imageData = new Image();
          imageData.onload = () => {
            dispatch(new StyleTranserProcessing(true)).pipe(
              delay(1000),
              switchMap(() => dispatch(new StyleTranser(imageData, imageStyle, 0.25)))
            ).subscribe();
          }
          imageData.src = pictureData;
        }
      })
    ).subscribe();
  }

  @Action(StyleTranser)
  async styleTranser({ dispatch, patchState }: StateContext<AppStateModel>, payload: StyleTranser) {
    const { imageData, imageStyle, strength } = payload;
    const styledImageData = await this.appService.styleTransfer(imageData, imageStyle, strength);
    this.cameraRollService.save(styledImageData, 'style-transfert-data').pipe(
      switchMap(() => this.cameraRollService.read('style-transfert-data'))
    ).subscribe(entry => {
      dispatch(new PreviewPictureData(entry.data));
    });

  }
}
