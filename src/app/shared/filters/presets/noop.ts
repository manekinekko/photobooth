export function noop() {
  return () => {
    this.compileShader();
    this.render(null, true);
  }
}
