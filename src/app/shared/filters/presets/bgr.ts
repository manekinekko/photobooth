import { colorMatrixShader } from "../shaders/color-matrix";

export function bgr() {
  return () => {
    colorMatrixShader.call(this)([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
  };
}
