import { asciiShader } from "../shaders/ascii";

export function ascii() {
  return () => {
    asciiShader.call(this)();
  };
}
