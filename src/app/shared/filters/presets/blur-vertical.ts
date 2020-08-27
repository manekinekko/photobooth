import { blurShader } from "../shaders/blur";
export function blurVertical() {
  return (size: number) => {
    blurShader.call(this)(size, 2);
  };
}
