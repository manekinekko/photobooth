import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class CameraService {
  resolutions: {
    vga: { width: 480; height: 640 };
  };
  constructor() {}

  async getVideosDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  }

  async getUserMedia({ width = 1920, height = 1080, deviceId }) {
    const constraints = {
      audio: false,
      video: {
        facingMode: "environment",
        width: {
          min: 1280,
          ideal: width,
          max: 2560,
        },
        height: {
          min: 720,
          ideal: height,
          max: 1440,
        },
        deviceId: {
          exact: deviceId,
        },
      },
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
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
