import { vignetteShader } from "../shaders/vignette";

export function vignette() {
  return () => {
    vignetteShader.call(this)();
  };
}
