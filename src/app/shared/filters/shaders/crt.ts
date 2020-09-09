import { CustomWebGLProgram } from "../../webgl-program.class";

export function crtShader(
  curvature = 1, // 0 - 10
  lineWidth = 1, // 0 - 5
  lineContrast = 1, // 0 - 1
  verticalLine = false, // true/false
  noise = 0.25, // 0 - 1
  noiseSize = 0, // 0 - 10
  vignetting = 0.3, // 0 - 1
  vignettingAlpha = 1, // 0 - 1
  vignettingBlur = 0.5,
  seed = 0 // 0 - 1
) {
  return () => {
    const SHADER = `
    precision highp float;

    varying vec2 imgCoord;
    const float SQRT_2 = 1.414213;
    const float light = 1.0;
    uniform sampler2D texture;
    uniform vec4 filterArea;
    uniform vec2 dimensions;
    uniform float curvature;
    uniform float lineWidth;
    uniform float lineContrast;
    uniform bool verticalLine;
    uniform float noise;
    uniform float noiseSize;
    uniform float vignetting;
    uniform float vignettingAlpha;
    uniform float vignettingBlur;
    uniform float seed;
    uniform float time;
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main(void)
    {
      vec2 pixelCoord = imgCoord.xy * filterArea.xy;
      vec2 coord = pixelCoord / dimensions;
      vec2 dir = vec2(coord - vec2(0.5, 0.5));
      float _c = curvature > 0. ? curvature : 1.;
      float k = curvature > 0. ?(length(dir * dir) * 0.25 * _c * _c + 0.935 * _c) : 1.;
      vec2 uv = dir * k;
      gl_FragColor = texture2D(texture, imgCoord);
      vec3 rgb = gl_FragColor.rgb;
      if (noise > 0.0 && noiseSize > 0.0)
      {
        pixelCoord.x = floor(pixelCoord.x / noiseSize);
        pixelCoord.y = floor(pixelCoord.y / noiseSize);
        float _noise = rand(pixelCoord * noiseSize * seed) - 0.5;
        rgb += _noise * noise;
      }
      if (lineWidth > 0.0) {
        float v = (verticalLine ? uv.x * dimensions.x : uv.y * dimensions.y) * min(1.0, 2.0 / lineWidth ) / _c;
        float j = 1. + cos(v * 1.2 - time) * 0.5 * lineContrast;
        rgb *= j;
        float segment = verticalLine ? mod((dir.x + .5) * dimensions.x, 4.) : mod((dir.y + .5) * dimensions.y, 4.);
        rgb *= 0.99 + ceil(segment) * 0.015;
      }
      if (vignetting > 0.0)
      {
        float outter = SQRT_2 - vignetting * SQRT_2;
        float darker = clamp((outter - length(dir) * SQRT_2) / ( 0.00001 + vignettingBlur * SQRT_2), 0.0, 1.0);
        rgb *= darker + (1.0 - darker) * (1.0 - vignettingAlpha);
      }
      gl_FragColor.rgb = rgb;
    }
    `;
    const program = this.compileShader(SHADER) as CustomWebGLProgram;

    this.gl.uniform4fv(program.uniform.filterArea, [this.width, this.height, 0, 0]);
    this.gl.uniform2fv(program.uniform.dimensions, [this.width, this.height]);
    this.gl.uniform1f(program.uniform.time, performance.now());
    this.gl.uniform1f(program.uniform.curvature, curvature);
    this.gl.uniform1f(program.uniform.lineWidth, lineWidth);
    this.gl.uniform1f(program.uniform.lineContrast, lineContrast);
    this.gl.uniform1f(program.uniform.verticalLine, verticalLine);
    this.gl.uniform1f(program.uniform.noise, noise);
    this.gl.uniform1f(program.uniform.noiseSize, noiseSize);
    this.gl.uniform1f(program.uniform.vignetting, vignetting);
    this.gl.uniform1f(program.uniform.vignettingAlpha, vignettingAlpha);
    this.gl.uniform1f(program.uniform.vignettingBlur, vignettingBlur);
    this.gl.uniform1f(program.uniform.seed, seed);

    this.render();
  };
}
