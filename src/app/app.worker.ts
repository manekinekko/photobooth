/// <reference lib="webworker" />

import '@tensorflow/tfjs';
import { ArbitraryStyleTransferNetwork } from "./shared/arbitrary-stylization.service";

addEventListener('message', async ({ data }: { data: { imageInput: ImageData, styleImage: ImageData, strength: number } }) => {
  const model = new ArbitraryStyleTransferNetwork();
  const styledImageData = await model.stylize(data.imageInput, data.styleImage, Number(data.strength));
  postMessage({
    styledImageData
  });
});
