import { colorMatrixShader } from "../shaders/color-matrix";

export function desaturateLuminance() {
  return () => {
    colorMatrixShader.call(this)([
      0.2764723,
      0.929708,
      0.0938197,
      0,
      -37.1,
      0.2764723,
      0.929708,
      0.0938197,
      0,
      -37.1,
      0.2764723,
      0.929708,
      0.0938197,
      0,
      -37.1,
      0,
      0,
      0,
      1,
      0,
    ]);
  };
}
