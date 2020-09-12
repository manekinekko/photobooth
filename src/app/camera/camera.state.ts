import { Injectable } from "@angular/core";
import { Action, NgxsOnInit, Selector, State, StateContext } from "@ngxs/store";
import { of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { DeviceSourceService } from "../device-source/device-source.service";
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

export class CameraDevices {
  static readonly type = "[Camera] devices";
  constructor(public readonly devices: CameraDeviceSource[]) {}
}

// state

export interface CameraDeviceSource {
  deviceId: string;
  label: string;
}
export interface CameraStateModel {
  mediaStream: MediaStream;
  source: string;
  width: number;
  height: number;
  preview: string;
  devices: CameraDeviceSource[];
}

@State<CameraStateModel>({
  name: "camera",
  defaults: {
    mediaStream: null,
    source: null,
    width: 1280,
    height: 720,
    preview: null,
    devices: [],
  },
})
@Injectable()
export class CameraState implements NgxsOnInit {
  constructor(
    private cameraService: CameraService,
    private blobService: BlobService,
    private sourceService: DeviceSourceService
  ) {}

  ngxsOnInit({ patchState }: StateContext<CameraStateModel>) {
    patchState({
      source: this.sourceService.restoreSourceId(),
    });
  }

  @Selector()
  static mediaStream(camera: CameraStateModel) {
    return camera.mediaStream;
  }

  @Selector()
  static preview(camera: CameraStateModel) {
    return camera.preview;
  }

  @Selector()
  static source(camera: CameraStateModel) {
    return camera.source;
  }

  @Selector()
  static devices(camera: CameraStateModel) {
    return camera.devices;
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
          source: payload.deviceId,
        });
      })
    );
  }

  @Action(RestartMediaStream)
  restartMediaStream({ dispatch }: StateContext<CameraStateModel>, payload: RestartMediaStream) {
    dispatch([new StopMediaStream(), new StartMediaStream(payload.deviceId)]);
  }

  @Action(SwitchCameraDevice)
  switchCameraDevice({ patchState, dispatch }: StateContext<CameraStateModel>, payload: SwitchCameraDevice) {
    patchState({
      source: payload.deviceId,
    });

    this.sourceService.saveSourceId(payload.deviceId);
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

  @Action(CameraDevices)
  cameraDevices({ patchState }: StateContext<CameraStateModel>, payload: CameraDevices) {
    patchState({
      devices: payload.devices,
    });
  }
}
