import { blurShader } from "../shaders/blur";
export function blurHorizontal() {
  return (size: number) => {
    blurShader.call(this)(size, 1);
  };
}
