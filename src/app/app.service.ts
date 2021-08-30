import * as mi from '@magenta/image';
import { Location } from "@angular/common";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class AppService {
  constructor(private location: Location) {}
  isRunningInMSTeams() {
    return this.location.path().includes("context=teams");
  }

  computeCameraAspectRatio() {
    return this.isRunningInMSTeams() ? 0.6 : 0.8;
  }

  async styleTransfer(image: HTMLImageElement, styleImg: HTMLImageElement, strength = 0.25) {
    const model = new mi.ArbitraryStyleTransferNetwork();
    await model.initialize();
    return await model.stylize(image, styleImg, strength);
  }
}
