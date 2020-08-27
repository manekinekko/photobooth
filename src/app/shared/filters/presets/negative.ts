import { contrast } from "./contrast";

export function negative() {
  return () => {
    contrast.call(this)(-2);
  };
}
