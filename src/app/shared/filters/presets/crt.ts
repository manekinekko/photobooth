import { colorMatrixShader } from "../shaders/color-matrix";
import { crtShader } from '../shaders/crt';

export function crt() {
  return () => {
    crtShader.call(this)();
  };
}
