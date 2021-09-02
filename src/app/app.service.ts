import { Location } from "@angular/common";
import { Injectable, NgZone } from "@angular/core";
import { BlobService } from "./camera/blob.service";
import { ArbitraryStyleTransferNetwork } from "./shared/arbitrary-stylization.service";

@Injectable({
  providedIn: "root",
})
export class AppService {
  constructor(
    private location: Location,
    private styleService: ArbitraryStyleTransferNetwork,
    private blobService: BlobService,
    private ngZone: NgZone
  ) { }

  isRunningInMSTeams() {
    return this.location.path().includes("context=teams");
  }

  computeCameraAspectRatio() {
    return this.isRunningInMSTeams() ? 0.6 : 0.8;
  }

  async styleTransfer(image: HTMLImageElement, styleImg: HTMLImageElement, strength: number): Promise<ImageData> {
    return this.ngZone.runOutsideAngular<any>(() => {
      return new Promise<ImageData>(async (resolve, reject) => {
        if (typeof Worker !== 'undefined') {
          const worker = new Worker(new URL('./app.worker', import.meta.url));
          worker.onmessage = ({ data }: { data: { styledImageData: ImageData } }) => {
            this.ngZone.run(() => {
              resolve(data.styledImageData);
            });
          };
          worker.onerror = (error) => {
            console.error(error);
          };

          const resizedImage = this.blobService.resizeImage(image, { maxWidth: 500 });
          const resizedStyleImg = this.blobService.resizeImage(styleImg, { maxWidth: 50 });
          worker.postMessage({
            image: resizedImage, styleImg: resizedStyleImg, strength
          });
        }
      });
    });
  }
}
