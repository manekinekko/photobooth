import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { BlobService } from "./camera/blob.service";
import { ArbitraryStyleTransferNetwork } from "./shared/arbitrary-stylization.service";

@Injectable({
  providedIn: "root",
})
export class AppService {
  constructor(private location: Location, private styleService: ArbitraryStyleTransferNetwork, private blobService: BlobService) { }
  isRunningInMSTeams() {
    return this.location.path().includes("context=teams");
  }

  computeCameraAspectRatio() {
    return this.isRunningInMSTeams() ? 0.6 : 0.8;
  }

  async styleTransfer(image: HTMLImageElement, styleImg: HTMLImageElement, strength = 0.25): Promise<ImageData> {
    const resizedImage = this.blobService.resizeImage(image);
    return await this.styleService.stylize(resizedImage as any /* workkaround for worker compatibility */, styleImg as any /* workkaround for worker compatibility */, strength);
    
    // return new Promise(async (resolve, reject) => {
    //   if (typeof Worker !== 'undefined') {
    //     const worker = new Worker('./app.worker', { type: 'module' });

    //     worker.onmessage = ({ data }) => {
    //       resolve(data);
    //     };

    //     worker.postMessage({
    //       image, styleImg, strength
    //     });
    //   }
    // });
  }
}
