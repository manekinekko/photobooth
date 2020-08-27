import { colorMatrixShader } from "../shaders/color-matrix";

export function hue() {
  return (rotation: number) => {
    rotation = ((rotation || 0) / 180) * Math.PI;
    const cos = Math.cos(rotation),
      sin = Math.sin(rotation),
      lumR = 0.213,
      lumG = 0.715,
      lumB = 0.072;

    colorMatrixShader.call(this)([
      lumR + cos * (1 - lumR) + sin * -lumR,
      lumG + cos * -lumG + sin * -lumG,
      lumB + cos * -lumB + sin * (1 - lumB),
      0,
      0,
      lumR + cos * -lumR + sin * 0.143,
      lumG + cos * (1 - lumG) + sin * 0.14,
      lumB + cos * -lumB + sin * -0.283,
      0,
      0,
      lumR + cos * -lumR + sin * -(1 - lumR),
      lumG + cos * -lumG + sin * lumG,
      lumB + cos * (1 - lumB) + sin * lumB,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ]);
  };
}
