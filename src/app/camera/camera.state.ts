import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { BlobService } from "./blob.service";
import { CameraService } from "./camera.service";

// actions
export class StartMediaStream {
  static readonly type = "[Camera] start media stream";
  constructor(public readonly deviceId: string) {}
}

export class RestartMediaStream {
  static readonly type = "[Camera] restart media stream";
  constructor(public readonly deviceId: string) {}
}

export class StopMediaStream {
  static readonly type = "[Camera] stop media stream";
}

export class CapturePicture {
  static readonly type = "[Camera] capture picture";
  constructor(public readonly canvasRef: HTMLCanvasElement) {}
}

export class CapturePictureData {
  static readonly type = "[Camera] picture data";
  constructor(public readonly data: string) {}
}

export class PreviewPictureData {
  static readonly type = "[Camera] preview picture data";
  constructor(public readonly data: string) {}
}

export class SwitchCameraDevice {
  static readonly type = "[Camera] switch camera device";
  constructor(public readonly deviceId: string) {}
}

// state
export interface CameraStateModel {
  mediaStream: MediaStream;
  deviceId: string;
  width: number;
  height: number;
  preview: string;
}

@State<CameraStateModel>({
  name: "camera",
  defaults: {
    mediaStream: null,
    deviceId: null,
    width: 1280,
    height: 720,
    preview: null,
  },
})
@Injectable()
export class CameraState {
  constructor(private cameraService: CameraService, private blobService: BlobService) {}

  @Selector()
  static mediaStream(camera: CameraStateModel) {
    return camera.mediaStream;
  }

  @Selector()
  static preview(camera: CameraStateModel) {
    return camera.preview;
  }

  @Action(StartMediaStream)
  startMediaStream({ patchState, getState }: StateContext<CameraStateModel>, payload: StartMediaStream) {
    const { mediaStream } = getState();

    if (mediaStream) {
      // media stream is already started, skip.
      return of();
    }

    return this.cameraService.getUserMedia({ deviceId: payload.deviceId }).pipe(
      tap((mediaStream) => {
        patchState({
          mediaStream,
        });
      })
    );
  }

  @Action(RestartMediaStream)
  restartMediaStream({ patchState, getState, dispatch }: StateContext<CameraStateModel>, payload: RestartMediaStream) {
    const { mediaStream } = getState();

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());

      patchState({
        mediaStream: null,
      });

      dispatch(new StartMediaStream(payload.deviceId));
    }
  }

  @Action(SwitchCameraDevice)
  switchCameraDevice({ patchState, dispatch }: StateContext<CameraStateModel>, payload: SwitchCameraDevice) {
    patchState({
      deviceId: payload.deviceId,
    });

    dispatch(new RestartMediaStream(payload.deviceId));
  }

  @Action(StopMediaStream)
  stopMediaStream({ patchState, getState }: StateContext<CameraStateModel>) {
    const { mediaStream } = getState();

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });

      patchState({
        mediaStream: null,
      });
    }
  }

  @Action(CapturePicture)
  capturePicture({ dispatch }: StateContext<CameraStateModel>, payload: CapturePicture) {
    return this.blobService.toBlob(payload.canvasRef, "image/png").pipe(
      switchMap((file: Blob) => this.blobService.toBase64(file)),
      tap((data) => {
        dispatch(new CapturePictureData(data));
      })
    );
  }
  @Action(PreviewPictureData)
  previewPictureData({ patchState }: StateContext<CameraStateModel>, payload: PreviewPictureData) {
    patchState({
      preview: payload.data,
    });
  }
}
