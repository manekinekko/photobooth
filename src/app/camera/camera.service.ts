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
}
