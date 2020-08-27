import { convolutionShader } from '../shaders/convolution';

export function edges() {
  return () => {
    convolutionShader.call(this)([0, 1, 0, 1, -4, 1, 0, 1, 0]);
  }
}