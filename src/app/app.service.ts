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

  async requestStyleTransferOperation(imageInput: ImageData, imageStyleTensorOrData: number[] | ImageData, strength: number): Promise<ImageData> {
    // return new Promise<ImageData>(async (resolve, reject) => {
    //   const model = new ArbitraryStyleTransferNetwork();
    //   const styledImageData = await model.stylize(image as any, styleImg as any, strength);
    //   resolve(styledImageData);
    // });

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
        worker.postMessage({
          imageInput, imageStyleTensorOrData, strength
        });
      }
    });
  }
}
