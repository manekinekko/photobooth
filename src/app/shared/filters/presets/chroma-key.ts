import { chromaKeyShader } from "../shaders/chroma-key";

export function chromaKey() {
  return () => {
    chromaKeyShader.call(this)();
  };
}
