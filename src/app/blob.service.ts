import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class BlobService {
  constructor() {}

  toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, type);
    });
  }

  toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        var base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.onabort = reject;
    });
  }
}
