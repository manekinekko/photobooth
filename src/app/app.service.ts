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
}
