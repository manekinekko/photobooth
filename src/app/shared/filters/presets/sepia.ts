import { colorMatrixShader } from "../shaders/color-matrix";

export function sepia() {
  /**
   * value between 0 and 1
   */
  return (value: number) => {
    const identity = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
    const dot = (ma: number[], mb: number[], amount: number) =>
      ma.map((a, i) => {
        const b = mb[i];
        return a + (b - a) * amount;
      });

    colorMatrixShader.call(this)(
      dot(
        identity,
        [
          0.393,
          0.769,
          0.189,
          0,
          0,
          //
          0.349,
          0.686,
          0.168,
          0,
          0,
          //
          0.272,
          0.534,
          0.131,
          0,
          0,
          //
          0,
          0,
          0,
          1,
          0,
        ],
        value
      )
    );
  };
}
