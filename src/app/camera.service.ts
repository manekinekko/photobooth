import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class CameraService {
  resolutions: {
    vga: { width: 480; height: 640 };
  };
  constructor() {}

  async getUserMedia(deviceId: string) {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: {
          min: 1280,
          ideal: 1920,
          max: 2560,
        },
        height: {
          min: 720,
          ideal: 1080,
          max: 1440,
        },
        deviceId: {
          exact: deviceId
        }
      },
    });
  }

  async getVideosDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  }

  // VGA
  async getMediaStream({ width, height }) {
    const constraints = {
      audio: false,
      video: {
        facingMode: "environment",
        width,
        height,
      },
    };

    console.log(navigator.mediaDevices.getSupportedConstraints());

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error("getUserMedia() error:", error);
    }
  }

  cropImage(videoElement: HTMLVideoElement, inContext: CanvasRenderingContext2D, target: HTMLElement, threshold = 0) {
    const { left, top, width, height } = target.getBoundingClientRect();
    const imageData = inContext.getImageData(left - threshold, top - threshold, width + threshold, height + threshold);
    let can = document.createElement("canvas");
    can.width = width;
    can.height = height;
    // can.getContext('2d').putImageData(imageData, 0, 0);
    can.getContext("2d").drawImage(videoElement, left, top, width, height, 0, 0, width, height);
    return can;
  }
}
