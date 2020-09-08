export function colorMatrixShader() {
  return (matrix: number[]) => {
    // Create a Float32 Array and normalize the offset component to 0-1
    const m = new Float32Array(matrix);
    m[4] /= 255;
    m[9] /= 255;
    m[14] /= 255;
    m[19] /= 255;
    const SHADER_WITH_ALPHA = `
    precision highp float;
    varying vec2 imgCoord;
    uniform sampler2D texture;
    uniform float m[20];

    void main(void) {
      vec4 c = texture2D(texture, imgCoord);
      gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[3] * c.a + m[4];
      gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[8] * c.a + m[9];
      gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[13] * c.a + m[14];
      gl_FragColor.a = m[15] * c.r + m[16] * c.g + m[17] * c.b + m[18] * c.a + m[19];
    }`;
    const SHADER_WITHOUT_ALPHA = `
    precision highp float;
    varying vec2 imgCoord;
    uniform sampler2D texture;
    uniform float m[20];

    void main(void) {
      vec4 c = texture2D(texture, imgCoord);
      gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[4];
      gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[9];
      gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[14];
      gl_FragColor.a = c.a;
    }`;
    // Can we ignore the alpha value? Makes things a bit faster.
    const shader =
      1 == m[18] && 0 == m[3] && 0 == m[8] && 0 == m[13] && 0 == m[15] && 0 == m[16] && 0 == m[17] && 0 == m[19]
        ? SHADER_WITHOUT_ALPHA
        : SHADER_WITH_ALPHA;

    const program = this.compileShader(shader);
    this.gl.uniform1fv(program.uniform.m, m);
    this.render();
  };
}
