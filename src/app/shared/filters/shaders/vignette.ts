import { CustomWebGLProgram } from "../../webgl-program.class";

export function vignetteShader() {
  return (size = 1.0) => {
    const SHADER = `
    precision highp float;
    
    varying highp vec2 imgCoord;
    
    uniform float size;
    uniform sampler2D texture;

    void main() {
      vec2 p = -1.0 + imgCoord * 2.0;
      float r = 1.0 - sqrt(dot(p, p));
      gl_FragColor = vec4(texture2D(texture, imgCoord).rgb * r * size, 1.0);
    }
    `;

    const program = this.compileShader(SHADER) as CustomWebGLProgram;
    this.gl.uniform1f(program.uniform.size, size);

    this.apply();
  };
}
