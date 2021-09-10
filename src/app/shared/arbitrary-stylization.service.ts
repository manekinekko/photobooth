// This implementation was inspired by: https://github.com/magenta/magenta-js/tree/master/image

import { Injectable } from '@angular/core';
import type {
  GraphModel,
  Tensor3D,
  Tensor4D
} from '@tensorflow/tfjs';
import {
  browser,
  engine,
  getBackend,
  loadGraphModel,
  memory,
  randomNormal,
  scalar,
  setBackend,
  tensor4d,
  tidy
} from '@tensorflow/tfjs';

const DEFAULT_STYLE_CHECKPOINT = '/assets/style-transfer/predictor';
const DEFAULT_TRANSFORM_CHECKPOINT = '/assets/style-transfer/transformer';

@Injectable({
  providedIn: 'root'
})
export class ArbitraryStyleTransferNetwork {
  private styleCheckpointURL: string;
  private transformCheckpointURL: string;

  private initialized = false;

  private styleNet: GraphModel;
  private transformNet: GraphModel;

  /**
   * `ArbitraryStyleTransferNetwork` constructor.
   */
  constructor() {
    this.styleCheckpointURL = DEFAULT_STYLE_CHECKPOINT;
    this.transformCheckpointURL = DEFAULT_TRANSFORM_CHECKPOINT;
    setBackend('webgl');
  }

  async warmup() {
    const input: Tensor3D = randomNormal([320, 240, 3]);
    let res = this.stylize(input, [0, 0, 0]);
    res = null;
    input.dispose()
  }

  isInitialized() {
    return this.initialized;
  }

  async initialize() {
    this.dispose();

    [this.styleNet, this.transformNet] = await Promise.all([
      loadGraphModel(this.styleCheckpointURL + '/model.json'),
      loadGraphModel(this.transformCheckpointURL + '/model.json'),
    ]);

    this.initialized = true;
    console.log('Initialized Arbitrary Style Transfer network');
    console.log('Backend:', getBackend());
  }

  dispose() {
    if (this.styleNet) {
      this.styleNet.dispose();
    }
    if (this.transformNet) {
      this.transformNet.dispose();
    }

    this.initialized = false;
  }

  private predictStyleParameters(style: ImageData | Tensor3D | number[]): Tensor4D {
    return tidy(() => {
      return this.styleNet.predict(
        browser.fromPixels(style as ImageData).toFloat().div(scalar(255)).expandDims()
      );
    }) as Tensor4D;
  }

  private produceStylized(content: ImageData | Tensor3D, bottleneck: Tensor4D): Tensor3D {
    return tidy(() => {
      const image: Tensor4D = this.transformNet.predict([
        browser.fromPixels(content as ImageData).toFloat().div(scalar(255)).expandDims(),
        bottleneck
      ]) as Tensor4D;
      return image.squeeze();
    });
  }

  stylize(content: ImageData | Tensor3D, styleData: number[] | ImageData, strength?: number): Promise<ImageData> {
    return new Promise(async (resolve, reject) => {

      engine().startScope();

      console.log('Stylizing image...');
      console.table(memory());

      if (!this.initialized) {
        await this.initialize();
      }

      let styleRepresentation: Tensor4D;
      if (styleData instanceof ImageData) {
        console.log(`Computing style parameters...`);

        styleRepresentation = this.predictStyleParameters(styleData);
        styleRepresentation.print(true);
        console.log(Array.from(await styleRepresentation.data()));
      }
      else if (Array.isArray(styleData)) {
        console.log(`Using precomputed style parameters...`);

        styleRepresentation = tensor4d(styleData, [1, 1, 1, 100], 'float32');
      }

      if (strength !== undefined) {
        styleRepresentation = styleRepresentation
          .mul(scalar(strength))
          .add(this.predictStyleParameters(content).mul(scalar(1.0 - strength)));
      }
      const stylizedImage = this.produceStylized(content, styleRepresentation);

      let bytes = await browser.toPixels(stylizedImage);
      const imageData = new ImageData(bytes, stylizedImage.shape[1], stylizedImage.shape[0]);
      
      resolve(imageData);
      
      // free memory
      styleRepresentation.dispose();
      stylizedImage.dispose();
      bytes = null; 
      styleData = null;

      engine().endScope();
      
      console.log('Stylized image done');
      console.table(memory());
    });
  }
}