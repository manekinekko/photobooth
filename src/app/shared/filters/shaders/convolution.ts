import { CustomWebGLProgram } from "../../webgl-program.class";

export function convolutionShader() {
  return (matrix: number[]) => {
    const m32 = new Float32Array(matrix);
    const pixelSizeX = 1 / this.width;
    const pixelSizeY = 1 / this.height;
    const SHADER = `
      precision highp float;
      varying vec2 imgCoord;
      uniform sampler2D texture;
      uniform vec2 px;
      uniform float m[9];

      void main(void) {
        vec4 c11 = texture2D(texture, imgCoord - px); // top left
        vec4 c12 = texture2D(texture, vec2(imgCoord.x, imgCoord.y - px.y)); // top center
        vec4 c13 = texture2D(texture, vec2(imgCoord.x + px.x, imgCoord.y - px.y)); // top right

        vec4 c21 = texture2D(texture, vec2(imgCoord.x - px.x, imgCoord.y) ); // mid left
        vec4 c22 = texture2D(texture, imgCoord); // mid center
        vec4 c23 = texture2D(texture, vec2(imgCoord.x + px.x, imgCoord.y) ); // mid right

        vec4 c31 = texture2D(texture, vec2(imgCoord.x - px.x, imgCoord.y + px.y) ); // bottom left
        vec4 c32 = texture2D(texture, vec2(imgCoord.x, imgCoord.y + px.y) ); // bottom center
        vec4 c33 = texture2D(texture, imgCoord + px ); // bottom right

        gl_FragColor = 
        c11 * m[0] + c12 * m[1] + c22 * m[2] +
        c21 * m[3] + c22 * m[4] + c23 * m[5] +
        c31 * m[6] + c32 * m[7] + c33 * m[8];
        gl_FragColor.a = c22.a;
      }`;

    const program = this.compileShader(SHADER) as CustomWebGLProgram;
    this.gl.uniform1fv(program.uniform.m, m32);
    this.gl.uniform2f(program.uniform.px, pixelSizeX, pixelSizeY);
    this.render();
  };
}
