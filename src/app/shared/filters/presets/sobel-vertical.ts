import { convolutionShader } from "../shaders/convolution";

export function sobelVertical() {
  return () => {
    convolutionShader.call(this)([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
  };
}
