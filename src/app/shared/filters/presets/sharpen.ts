import { convolutionShader } from "../shaders/convolution";

export function sharpen() {
  return (amount: number) => {
    const a = amount || 1;
    convolutionShader.call(this)([0, -1 * a, 0, -1 * a, 1 + 4 * a, -1 * a, 0, -1 * a, 0]);
  };
}
