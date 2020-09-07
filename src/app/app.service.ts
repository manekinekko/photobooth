import { Injectable } from "@angular/core";

export enum CONTEXT {
  STANDALONE,
  MS_TEAMS,
}

@Injectable({
  providedIn: "root",
})
export class AppService {
  private context: CONTEXT = CONTEXT.STANDALONE;
  constructor() {
    if (this.isRunningInMSTeams()) {
      console.log("MS Teams context detected");
    }
  }
  setContext(context: CONTEXT) {
    this.context = context;
  }
  isRunningInMSTeams() {
    return this.context === CONTEXT.MS_TEAMS;
  }

  computeCameraAspectRatio() {
    return this.isRunningInMSTeams() ? 0.6 : 0.8;
  }
}
