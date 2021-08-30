import { Injectable } from "@angular/core";
// import * as facemesh from "@tensorflow-models/facemesh";

@Injectable({
  providedIn: "root",
})
export class FaceMeshService {
  model;

  constructor() {}

  async initialize() {
    // this.model = await facemesh.load({
    //   maxFaces: 1,
    // });
    // return this.model;
  }

  async predictFaceMesh(canvas: HTMLCanvasElement): Promise<number[]> {
    let scaledMesh = [];
    if (this.model && canvas) {
      const predictions = (await this.model.estimateFaces(canvas)) as any[];
      if (predictions.length > 0) {
        // let's just compute one face for now!
        scaledMesh = predictions.pop().scaledMesh;
      }
    }
    return scaledMesh;
  }
}
