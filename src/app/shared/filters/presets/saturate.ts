import { colorMatrixShader } from "../shaders/color-matrix";

export function saturate() {
  return (amount: number) => {
    const x = ((amount || 0) * 2) / 3 + 1;
    const y = (x - 1) * -0.5;
    colorMatrixShader.call(this)([x, y, y, 0, 0, y, x, y, 0, 0, y, y, x, 0, 0, 0, 0, 0, 1, 0]);
  };
}
