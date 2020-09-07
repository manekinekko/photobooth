import { colorMatrixShader } from "../shaders/color-matrix";

export function brightness() {
  /**
   * value >= 0
   * 0: dark
   * 1+: brighter
   */
  return (value: number) => {
    colorMatrixShader.call(this)([value, 0, 0, 0, 0, 0, value, 0, 0, 0, 0, 0, value, 0, 0, 0, 0, 0, 1, 0]);
  };
}
