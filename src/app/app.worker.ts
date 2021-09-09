/// <reference lib="webworker" />

import '@tensorflow/tfjs';
import { ArbitraryStyleTransferNetwork } from "./shared/arbitrary-stylization.service";

addEventListener('message', async ({ data }: { data: { imageInput: ImageData, imageStyleIdOrData: string, strength: number } }) => {
  const model = new ArbitraryStyleTransferNetwork();
  const styledImageData = await model.stylize(data.imageInput, data.imageStyleIdOrData, Number(data.strength));
  postMessage({
    styledImageData
  });
});
