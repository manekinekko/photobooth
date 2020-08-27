import { colorMatrixShader } from "../shaders/color-matrix";

export function brightness() {
  return (value: number) => {
    const b = (value || 0) + 1;
    colorMatrixShader.call(this)([b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0]);
  };
}
