import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class BlobService {
  constructor() { }

  toBlob(canvas: HTMLCanvasElement, type: string): Observable<Blob> {
    return new Observable((observer) => canvas.toBlob((blob) => observer.next(blob), type));
  }

  toBase64(blob: Blob): Observable<string> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        const base64data = reader.result as string;
        observer.next(base64data);
      };
      reader.onerror = (error) => observer.error(error);
      reader.onabort = (error) => observer.error(error);
    });
  }

  imageDataToBase64(data: ImageData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = data.width;
        canvas.height = data.height;
        const ctx = canvas.getContext("2d");
        ctx.putImageData(data, 0, 0);
        resolve(ctx.canvas.toDataURL());
      }
      catch (error) {
        reject(error);
      }
    });
  }

  resizeImage(img: HTMLImageElement) {
    const settings = {
      max_width: 600,
      max_height: 200
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")
    const canvasCopy = document.createElement("canvas")
    const copyContext = canvasCopy.getContext("2d")
    let ratio = 1

    if (img.width > settings.max_width) {
      ratio = settings.max_width / img.width
    }
    else if (img.height > settings.max_height) {
      ratio = settings.max_height / img.height

    }

    canvasCopy.width = img.width
    canvasCopy.height = img.height
    copyContext.drawImage(img, 0, 0)

    canvas.width = img.width * ratio
    canvas.height = img.height * ratio
    ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height)

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}
