/// <reference lib="webworker" />

import '@tensorflow/tfjs';
import { ArbitraryStyleTransferNetwork } from "./shared/arbitrary-stylization.service";

(this as any).window = this;

addEventListener('message', async ({ data }) => {
  const model = new ArbitraryStyleTransferNetwork();
  await model.initialize();
  const styledImageData = await model.stylize(data.image, data.styleImg, data.strength);

  postMessage({
    styledImageData
  });
});
