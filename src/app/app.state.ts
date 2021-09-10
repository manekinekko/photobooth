import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { map, switchMap, tap } from "rxjs/operators";
import { AppService } from "./app.service";
import { CameraRollService } from "./camera-roll/camera-roll.service";
import { CameraRollState, PictureItem } from "./camera-roll/camera-roll.state";
import { BlobService } from "./camera/blob.service";
import { PreviewPictureData } from "./camera/camera.state";

// actions

export class IframeMessage {
  static readonly type = "[Iframe] dispatch message";
  constructor(public readonly data: string) { }
}

export class SelectStyleTranserImage {
  static readonly type = "[styleTranfer] select transfer style image source";
  constructor(public imageStyleTensorOrSrc: string, public strength: number) { }
}

export class StyleTranser {
  static readonly type = "[styleTranfer] transfer style to image";
  constructor(public imageInput: HTMLImageElement, public imageStyleTensorValuesOrHTMLImage: number[] | HTMLImageElement, public strength: number) { }
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
  imageContent?: HTMLImageElement;
  tensor?: {
    values: number[];
    id: string;
  };
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
    private readonly blobService: BlobService,
    private readonly store: Store
  ) { }

  @Selector()
  static styleTransferProcessingStatus(state: AppStateModel) {
    return state.styleTransferProcessingStatus;
  }

  @Action(IframeMessage)
  initializeTimer({ patchState }: StateContext<AppStateModel>, payload: IframeMessage) {
    // patchState({
    //   lastCapturedPicture: payload.data,
    // });

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
    const { imageStyleTensorOrSrc, strength } = payload;

    let tensorOrImageContent: HTMLImageElement | number[];
    if (imageStyleTensorOrSrc.endsWith(".json")) {
      // load tensor
      const res = await fetch(imageStyleTensorOrSrc);
      const tensor = await res.json() as { values: number[], id: string };
      tensorOrImageContent = tensor.values;

      patchState({
        styleTransfer: {
          tensor,
          strength
        }
      });
    }
    else {
      // load image content
      const imageContent = new Image();
      imageContent.onload = () => {
        tensorOrImageContent = imageContent;

        patchState({
          styleTransfer: {
            imageContent,
            strength
          }
        });
      };
      imageContent.src = imageStyleTensorOrSrc;
    }

    const selectedPictureId = this.store.selectSnapshot(CameraRollState.selectedPictureId);
    this.cameraRollService.read(selectedPictureId).pipe(
      map((picture: PictureItem) => picture.data),
      tap((pictureData: string) => {
        if (pictureData) {
          dispatch(new StyleTranserProcessing(true));
          const imageData = new Image();
          imageData.onload = () => {
            dispatch(new StyleTranser(imageData, tensorOrImageContent, payload.strength));
          }
          imageData.src = pictureData;
        }
      })
    ).subscribe();
  }

  @Action(StyleTranser)
  async styleTranser({ dispatch }: StateContext<AppStateModel>, payload: StyleTranser) {
    const { imageInput, imageStyleTensorValuesOrHTMLImage, strength } = payload;

    let imageStyle: ImageData | number[] = imageStyleTensorValuesOrHTMLImage as number[];
    if (imageStyleTensorValuesOrHTMLImage instanceof HTMLImageElement) {
      imageStyle = await this.blobService.resizeImage(imageStyleTensorValuesOrHTMLImage);
    }

    const imageData = await this.blobService.resizeImage(imageInput, { maxWidth: 450 });
    const styledImageData = await this.appService.requestStyleTransferOperation(imageData, imageStyle, strength);
    this.cameraRollService.save(styledImageData, 'style-transfert-data').pipe(
      switchMap(() => this.cameraRollService.read('style-transfert-data'))
    ).subscribe((entry: PictureItem) => {
      dispatch(new PreviewPictureData(entry.data));
      dispatch(new StyleTranserProcessing(false));
    });

  }
}
