/// <reference lib="webworker" />

import '@tensorflow/tfjs';
import { ArbitraryStyleTransferNetwork } from "./shared/arbitrary-stylization.service";

addEventListener('message', async ({ data }: { data: { image: ImageData, styleImg: ImageData, strength: number } }) => {
  const image = new ImageData(data.image.data, data.image.width, data.image.height);
  const styleImg = new ImageData(data.styleImg.data, data.styleImg.width, data.styleImg.height);
  const model = new ArbitraryStyleTransferNetwork();
  const styledImageData = await model.stylize(image, styleImg, Number(data.strength));

  postMessage({
    styledImageData
  });
});
