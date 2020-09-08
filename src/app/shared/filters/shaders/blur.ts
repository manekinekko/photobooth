export function blurShader() {
  return (size: number, type: 1 | 2 | 3 = 1) => {
    const SHADER = `
      precision highp float;
      varying vec2 imgCoord;
      uniform sampler2D texture;
      uniform vec2 px;

      void main(void) {
        gl_FragColor = vec4(0.0);
        gl_FragColor += texture2D(texture, imgCoord + vec2(-7.0*px.x, -7.0*px.y))*0.0044299121055113265;
        gl_FragColor += texture2D(texture, imgCoord + vec2(-6.0*px.x, -6.0*px.y))*0.00895781211794;
        gl_FragColor += texture2D(texture, imgCoord + vec2(-5.0*px.x, -5.0*px.y))*0.0215963866053;
        gl_FragColor += texture2D(texture, imgCoord + vec2(-4.0*px.x, -4.0*px.y))*0.0443683338718;
        gl_FragColor += texture2D(texture, imgCoord + vec2(-3.0*px.x, -3.0*px.y))*0.0776744219933;
        gl_FragColor += texture2D(texture, imgCoord + vec2(-2.0*px.x, -2.0*px.y))*0.115876621105;
        gl_FragColor += texture2D(texture, imgCoord + vec2(-1.0*px.x, -1.0*px.y))*0.147308056121;
        gl_FragColor += texture2D(texture, imgCoord                             )*0.159576912161;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 1.0*px.x,  1.0*px.y))*0.147308056121;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 2.0*px.x,  2.0*px.y))*0.115876621105;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 3.0*px.x,  3.0*px.y))*0.0776744219933;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 4.0*px.x,  4.0*px.y))*0.0443683338718;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 5.0*px.x,  5.0*px.y))*0.0215963866053;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 6.0*px.x,  6.0*px.y))*0.00895781211794;
        gl_FragColor += texture2D(texture, imgCoord + vec2( 7.0*px.x,  7.0*px.y))*0.0044299121055113265;
      }
    `;
    const blurSizeX = size / 7 / this.width;
    const blurSizeY = size / 7 / this.height;
    const program = this.compileShader(SHADER);
    const h = (intermediate = false) => {
      this.gl.uniform2f(program.uniform.px, blurSizeX, 0);
      this.render(intermediate && this.DRAW.INTERMEDIATE);
    };
    const v = (intermediate = false) => {
      this.gl.uniform2f(program.uniform.px, 0, blurSizeY);
      this.render(intermediate && this.DRAW.INTERMEDIATE);
    };

    switch (type) {
      case 1:
        // Horizontal
        h();
        break;
      case 2:
        // Vertical
        v();
        break;
      // horizontal then vertical
      case 3:
      default:
        h(true);
        v();
    }
  };
}
