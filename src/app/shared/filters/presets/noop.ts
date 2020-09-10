export function noop() {
  return () => {
    this.compileShader();
    this.apply(null, true);
  }
}
