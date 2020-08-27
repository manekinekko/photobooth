import { blurShader } from "../shaders/blur";
export function blur() {
  return (size: number) => {
    blurShader.call(this)(size, 3);
  };
}
