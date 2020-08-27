import { saturate } from "./saturate";

export function desaturate() {
  return () => {
    saturate.call(this)(-1);
  };
}
