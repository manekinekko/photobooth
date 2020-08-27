import { convolutionShader } from "../shaders/convolution";

export function sobelHorizontal() {
  return () => {
    convolutionShader.call(this)([-1, -2, -1, 0, 0, 0, 1, 2, 1]);
  };
}
