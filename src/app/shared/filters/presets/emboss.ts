import { convolutionShader } from "../shaders/convolution";

export function emboss() {
  return (size: number) => {
    const s = size || 1;
    convolutionShader.call(this)([-2 * s, -1 * s, 0, -1 * s, 1, 1 * s, 0, 1 * s, 2 * s]);
  };
}
