import { Injectable } from "@angular/core";
import { defer, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CameraService {
  constructor() {}

  async getVideosDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  }

  getUserMedia({ width = 1280, height = 720, deviceId }): Observable<MediaStream> {
    const constraints = {
      audio: false,
      video: {
        width: {
          ideal: width,
        },
        height: {
          ideal: height,
        },
        deviceId: {
          exact: deviceId,
        },
      },
    };

    try {
      return defer(async () => await navigator.mediaDevices.getUserMedia(constraints));
    } catch (error) {
      console.error("getUserMedia() error:", error);
    }
  }

  cropImage(videoElement: HTMLVideoElement, inContext: CanvasRenderingContext2D, target: HTMLElement, threshold = 0) {
    const { left, top, width, height } = target.getBoundingClientRect();
    const imageData = inContext.getImageData(left - threshold, top - threshold, width + threshold, height + threshold);
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(videoElement, left, top, width, height, 0, 0, width, height);
    return canvas;
  }
}
