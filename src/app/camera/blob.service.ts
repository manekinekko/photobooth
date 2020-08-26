import { Injectable } from "@angular/core";
import { defer, Observable, of, throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class BlobService {
  constructor() {}

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
}
