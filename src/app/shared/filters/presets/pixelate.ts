export function pixelate() {
  return (size: number) => {
    const blurSizeX = size / this.width;
    const blurSizeY = size / this.height;
    const SHADER = `
      precision highp float;
      varying vec2 imgCoord;
      uniform vec2 size;
      uniform sampler2D texture;
   
      vec2 pixelate(vec2 coord, vec2 size) {
       return floor( coord / size ) * size;
      }
   
      void main(void) {
       gl_FragColor = vec4(0.0);
       vec2 coord = pixelate(imgCoord, size);
       gl_FragColor += texture2D(texture, coord);
      }
    `;

    const program = this.compileShader(SHADER);

    // Horizontal
    this.gl.uniform2f(program.uniform.size, blurSizeX, blurSizeY);
    this.render();
  };
}
