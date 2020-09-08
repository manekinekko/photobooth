import { CustomWebGLProgram } from '../../webgl-program.class';

export function vignetteShader() {
  return () => {
    const SHADER = `
precision highp float;
varying highp vec2 imgCoord;
uniform float size;
uniform sampler2D texture;

void main() {
  float size = 1.0;
  vec2 p = -1.0 + imgCoord * 2.0;
  float r = 1.0 - sqrt(dot(p, p));
  gl_FragColor = vec4(texture2D(texture, imgCoord).rgb * r * size, 1.0);
}
    `;

    const program = this.compileShader(SHADER) as CustomWebGLProgram;
    this.render();
  };
}
