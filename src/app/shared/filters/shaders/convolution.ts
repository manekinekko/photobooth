export function convolutionShader() {
  return (matrix: number[]) => {
    const m = new Float32Array(matrix);
    const pixelSizeX = 1 / this.width;
    const pixelSizeY = 1 / this.height;
    const SHADER = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D texture;
      uniform vec2 px;
      uniform float m[9];

      void main(void) {
        vec4 c11 = texture2D(texture, vUv - px); // top left
        vec4 c12 = texture2D(texture, vec2(vUv.x, vUv.y - px.y)); // top center
        vec4 c13 = texture2D(texture, vec2(vUv.x + px.x, vUv.y - px.y)); // top right

        vec4 c21 = texture2D(texture, vec2(vUv.x - px.x, vUv.y) ); // mid left
        vec4 c22 = texture2D(texture, vUv); // mid center
        vec4 c23 = texture2D(texture, vec2(vUv.x + px.x, vUv.y) ); // mid right

        vec4 c31 = texture2D(texture, vec2(vUv.x - px.x, vUv.y + px.y) ); // bottom left
        vec4 c32 = texture2D(texture, vec2(vUv.x, vUv.y + px.y) ); // bottom center
        vec4 c33 = texture2D(texture, vUv + px ); // bottom right

        gl_FragColor = 
        c11 * m[0] + c12 * m[1] + c22 * m[2] +
        c21 * m[3] + c22 * m[4] + c23 * m[5] +
        c31 * m[6] + c32 * m[7] + c33 * m[8];
        gl_FragColor.a = c22.a;
      }`;

    const program = this.compileShader(SHADER);
    this.gl.uniform1fv(program.uniform.m, m);
    this.gl.uniform2f(program.uniform.px, pixelSizeX, pixelSizeY);
    this.draw();
  };
}
