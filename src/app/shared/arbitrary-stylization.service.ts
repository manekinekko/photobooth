// This implementation was inspired by: https://github.com/magenta/magenta-js/tree/master/image

import { Injectable } from '@angular/core';
import type {
  GraphModel,
  Tensor3D,
  Tensor4D,
  DataTypeMap
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
import { PrecomputedStylization } from './arbitrary-stylization.constant';

// tslint:disable:max-line-length
const DEFAULT_STYLE_CHECKPOINT = '/assets/style-transfer/predictor';
const DEFAULT_TRANSFORM_CHECKPOINT = '/assets/style-transfer/transformer';
// tslint:enable:max-line-length

/**
 * Main ArbitraryStyleTransferNetwork class
 */

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
   *
   * @param styleCheckpointURL Path to style model checkpoint directory.
   * @param transformCheckpointURL Path to transformation model checkpoint
   * directory.
   */
  constructor() {
    this.styleCheckpointURL = DEFAULT_STYLE_CHECKPOINT;
    this.transformCheckpointURL = DEFAULT_TRANSFORM_CHECKPOINT;
    setBackend('webgl');
  }

  async warmup() {
    // Also warmup
    const input: Tensor3D = randomNormal([320, 240, 3]);
    let res = this.stylize(input, '0');
    res = null;
    input.dispose()
  }

  /**
   * Returns true if model is initialized.
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Loads models from the checkpoints.
   */
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

  /**
   * This function returns style bottleneck features for
   * the given image.
   *
   * @param style Style image to get 100D bottleneck features for
   */
  private predictStyleParameters(style: ImageData | Tensor3D | number[]): Tensor4D {
    return tidy(() => {
      return this.styleNet.predict(
        browser.fromPixels(style as ImageData).toFloat().div(scalar(255)).expandDims()
      );
    }) as Tensor4D;
  }

  /**
   * This function stylizes the content image given the bottleneck
   * features. It returns a tf.Tensor3D containing the stylized image.
   *
   * @param content Content image to stylize
   * @param bottleneck Bottleneck features for the style to use
   */
  private produceStylized(content: ImageData | Tensor3D, bottleneck: Tensor4D): Tensor3D {
    return tidy(() => {
      const image: Tensor4D = this.transformNet.predict([
        browser.fromPixels(content as ImageData).toFloat().div(scalar(255)).expandDims(),
        bottleneck
      ]) as Tensor4D;
      return image.squeeze();
    });
  }

  /**
   * This function stylizes the content image given the style image.
   * It returns an ImageData instance containing the stylized image.
   *
   * TODO(vdumoulin): Add option to resize style and content images.
   * TODO(adarob): Add option to use model with depthwise separable convs.
   *
   * @param content Content image to stylize
   * @param style Style image to use
   * @param strength If provided, controls the stylization strength.
   * Should be between 0.0 and 1.0.
   */
  stylize(content: ImageData | Tensor3D, style: string | ImageData, strength?: number): Promise<ImageData> {
    return new Promise(async (resolve, reject) => {

      engine().startScope();

      console.log('Stylizing image...');
      console.table(memory());

      if (!this.initialized) {
        await this.initialize();
      }

      let styleRepresentation: Tensor4D;
      if (style instanceof ImageData) {
        console.log(`Computing style parameters...`);

        styleRepresentation = this.predictStyleParameters(style);
        styleRepresentation.print(true);
        console.log(Array.from(await styleRepresentation.data()));
      }
      else if (typeof style === 'string') {
        console.log(`Loading precomputed style parameters for '${style}'...`);
        
        let precomputedStylizationValues = PrecomputedStylization.find(x => x.id === style).values;
        styleRepresentation = tensor4d(precomputedStylizationValues, [1, 1, 1, 100], 'float32');
      }

      if (strength !== undefined) {
        styleRepresentation = styleRepresentation
          .mul(scalar(strength))
          .add(this.predictStyleParameters(content).mul(scalar(1.0 - strength)));
      }
      const stylized = this.produceStylized(content, styleRepresentation);

      const bytes = await browser.toPixels(stylized);
      const imageData = new ImageData(bytes, stylized.shape[1], stylized.shape[0]);
      styleRepresentation.dispose();
      stylized.dispose();

      resolve(imageData);

      engine().endScope();
      console.log('Stylized image done');
      console.table(memory());
    });
  }
}