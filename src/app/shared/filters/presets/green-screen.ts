import { greenScreenShader } from "../shaders/green-screen";

export function greenScreen() {
  return () => {
    greenScreenShader.call(this)();
  };
}
