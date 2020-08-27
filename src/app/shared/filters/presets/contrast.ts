import { colorMatrixShader } from "../shaders/color-matrix";

export function contrast() {
  return (amount: number) => {
    const v = (amount || 0) + 1;
    const o = -128 * (v - 1);

    colorMatrixShader.call(this)([v, 0, 0, 0, o, 0, v, 0, 0, o, 0, 0, v, 0, o, 0, 0, 0, 1, 0]);
  };
}
