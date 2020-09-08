import { tvShader } from "../shaders/tv";

export function tv() {
  return () => {
    tvShader.call(this)();
  };
}
