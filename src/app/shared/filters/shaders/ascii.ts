// "Money filter" by @giacomopc https://shadertoy.com/view/XlsXDN

import { CustomWebGLProgram } from "../../webgl-program.class";

export function asciiShader() {
  return () => {
    const SHADER = `#version 300 es
    precision highp float;
    uniform float time;
    out vec2 imgCoord;
    uniform sampler2D texture;

    float character(int n, vec2 p)
    {
      p = floor(p*vec2(4.0, -4.0) + 2.5);
        if (clamp(p.x, 0.0, 4.0) == p.x)
      {
            if (clamp(p.y, 0.0, 4.0) == p.y)	
        {
              int a = int(round(p.x) + 5.0 * round(p.y));
          if (((n >> a) & 1) == 1) return 1.0;
        }	
        }
      return 0.0;
    }

    void render( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 pix = fragCoord.xy;
      vec3 col = texture2D(texture, floor(pix/8.0)*8.0/imgCoord.xy).rgb;	
      
      float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;
      
      int n =  4096;                // .
      if (gray > 0.2) n = 65600;    // :
      if (gray > 0.3) n = 332772;   // *
      if (gray > 0.4) n = 15255086; // o 
      if (gray > 0.5) n = 23385164; // &
      if (gray > 0.6) n = 15252014; // 8
      if (gray > 0.7) n = 13199452; // @
      if (gray > 0.8) n = 11512810; // #
      
      vec2 p = mod(pix/4.0, 2.0) - vec2(1.0);
      col = col*character(n, p);
      
      fragColor = vec4(col, 1.0);
    }
    
    void main() {
      vec4 col;
      render(col, gl_FragCoord.xy);
      gl_FragColor = col;
    }
    `;

    const program = this.compileShader(SHADER) as CustomWebGLProgram;
    this.render();
  };
}
