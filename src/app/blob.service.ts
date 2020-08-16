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
}
