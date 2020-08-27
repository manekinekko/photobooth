/**
 * Code adapted from https://github.com/phoboslab/WebGLImageFilter
 * License MIT
 */

export class CustomWebGLProgram {
  public uniform: { [key: string]: WebGLUniformLocation } = {};
  public attribute: { [key: string]: number } = {};
  public id: WebGLProgram;

  constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const vsh = this._compile(gl, vertexSource, gl.VERTEX_SHADER);
    const _fsh = this._compile(gl, fragmentSource, gl.FRAGMENT_SHADER);

    this.id = gl.createProgram();
    gl.attachShader(this.id, vsh);
    gl.attachShader(this.id, _fsh);
    gl.linkProgram(this.id);

    if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
    }

    gl.useProgram(this.id);

    // Collect attributes
    this._collect(vertexSource, "attribute", this.attribute);
    for (const a in this.attribute) {
      this.attribute[a] = gl.getAttribLocation(this.id, a);
    }

    // Collect uniforms
    this._collect(vertexSource, "uniform", this.uniform);
    this._collect(fragmentSource, "uniform", this.uniform);
    for (const u in this.uniform) {
      this.uniform[u] = gl.getUniformLocation(this.id, u);
    }
  }

  private _collect(source: string, prefix: string, collection: object) {
    const r = new RegExp("\\b" + prefix + " \\w+ (\\w+)", "ig");
    source.replace(r, function (match, name) {
      collection[name] = 0;
      return match;
    });
  }

  private _compile(gl: WebGLRenderingContext, source: string, type: number) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return null;
    }
    return shader;
  }
}

export class WebGLFilter {
  private gl: WebGLRenderingContext = null;
  private drawCount = 0;
  private sourceTexture: WebGLTexture = null;
  private lastInChain = false;
  private currentFramebufferIndex = -1;
  private tempFramebuffers = [null, null];
  private filterChain: Array<{ func: Function; args: any[] }> = [];
  private width = -1;
  private height = -1;
  private vertexBuffer: WebGLBuffer = null;
  private currentProgram: CustomWebGLProgram = null;
  private canvas: HTMLCanvasElement = null;
  // key is the shader program source, value is the compiled program
  private shaderProgramCache = {};
  private filter: any = {};

  private DRAW = {
    INTERMEDIATE: 1,
  };

  private SHADER = {
    VERTEX_IDENTITY: [
      "precision highp float;",
      "attribute vec2 pos;",
      "attribute vec2 uv;",
      "varying vec2 vUv;",
      "uniform float flipY;",

      "void main(void) {",
      "vUv = uv;",
      "gl_Position = vec4(pos.x, pos.y*flipY, 0.0, 1.);",
      "}",
    ].join("\n"),

    FRAGMENT_IDENTITY: [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D texture;",

      "void main(void) {",
      "gl_FragColor = texture2D(texture, vUv);",
      "}",
    ].join("\n"),
  };

  constructor() {
    this.canvas = document.createElement("canvas");
    this.gl = this.canvas.getContext("webgl");

    if (!this.gl) {
      throw "Couldn't get WebGL context";
    }

    this.initializePresets();
  }

  addFilter(name: string, ...args: any[]) {
    const filter = this.filter[name];

    this.filterChain.push({ func: filter, args });
  }

  reset() {
    this.filterChain = [];
  }

  apply(imageOrCanvas: HTMLCanvasElement) {
    this.resize(imageOrCanvas.width, imageOrCanvas.height);

    this.drawCount = 0;

    // Create the texture for the input image if we haven't yet
    if (!this.sourceTexture) {
      this.sourceTexture = this.gl.createTexture();
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageOrCanvas);

    // No filters? Just draw
    if (this.filterChain.length == 0) {
      this.compileShader(this.SHADER.FRAGMENT_IDENTITY);
      this.draw();
      return this.canvas;
    }

    for (let i = 0; i < this.filterChain.length; i++) {
      this.lastInChain = i == this.filterChain.length - 1;
      const f = this.filterChain[i];

      f.func.apply(this, f.args || []);
    }

    return this.canvas;
  }

  private resize(width: number, height: number) {
    // Same width/height? Nothing to do here
    if (width == this.width && height == this.height) {
      return;
    }

    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;

    // Create the context if we don't have it yet
    if (!this.vertexBuffer) {
      // Create the vertex buffer for the two triangles [x, y, u, v] * 6
      const vertices = new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0]);
      (this.vertexBuffer = this.gl.createBuffer()), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

      // Note sure if this is a good idea; at least it makes texture loading
      // in Ejecta instant.
      this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }

    this.gl.viewport(0, 0, this.width, this.height);

    // Delete old temp framebuffers
    this.tempFramebuffers = [null, null];
  }

  private getTempFramebuffer(index: number) {
    this.tempFramebuffers[index] =
      this.tempFramebuffers[index] || this.createFramebufferTexture(this.width, this.height);

    return this.tempFramebuffers[index];
  }

  private createFramebufferTexture(width: number, height: number) {
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);

    const renderbuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);

    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return { fbo: fbo, texture: texture };
  }

  private draw(flags = null) {
    let source = null,
      target = null,
      flipY = false;

    // Set up the source
    if (this.drawCount == 0) {
      // First draw call - use the source texture
      source = this.sourceTexture;
    } else {
      // All following draw calls use the temp buffer last drawn to
      source = this.getTempFramebuffer(this.currentFramebufferIndex).texture;
    }
    this.drawCount++;

    // Set up the target
    if (this.lastInChain && !(flags & this.DRAW.INTERMEDIATE)) {
      // Last filter in our chain - draw directly to the WebGL Canvas. We may
      // also have to flip the image vertically now
      target = null;
      flipY = this.drawCount % 2 == 0;
    } else {
      // Intermediate draw call - get a temp buffer to draw to
      this.currentFramebufferIndex = (this.currentFramebufferIndex + 1) % 2;
      target = this.getTempFramebuffer(this.currentFramebufferIndex).fbo;
    }

    // Bind the source and target and draw the two triangles
    this.gl.bindTexture(this.gl.TEXTURE_2D, source);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

    this.gl.uniform1f(this.currentProgram.uniform.flipY, flipY ? -1 : 1);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private compileShader(fragmentSource) {
    if (this.shaderProgramCache[fragmentSource]) {
      this.currentProgram = this.shaderProgramCache[fragmentSource];
      this.gl.useProgram(this.currentProgram.id);
      return this.currentProgram;
    }

    // Compile shaders
    this.currentProgram = new CustomWebGLProgram(this.gl, this.SHADER.VERTEX_IDENTITY, fragmentSource);

    const floatSize = Float32Array.BYTES_PER_ELEMENT;
    const vertSize = 4 * floatSize;
    this.gl.enableVertexAttribArray(this.currentProgram.attribute.pos);
    this.gl.vertexAttribPointer(this.currentProgram.attribute.pos, 2, this.gl.FLOAT, false, vertSize, 0 * floatSize);
    this.gl.enableVertexAttribArray(this.currentProgram.attribute.uv);
    this.gl.vertexAttribPointer(this.currentProgram.attribute.uv, 2, this.gl.FLOAT, false, vertSize, 2 * floatSize);

    this.shaderProgramCache[fragmentSource] = this.currentProgram;
    return this.currentProgram;
  }

  private initializePresets() {
    this.filter.colorMatrix = (matrix) => {
      // Create a Float32 Array and normalize the offset component to 0-1
      const m = new Float32Array(matrix);
      m[4] /= 255;
      m[9] /= 255;
      m[14] /= 255;
      m[19] /= 255;

      // Can we ignore the alpha value? Makes things a bit faster.
      const shader =
        1 == m[18] && 0 == m[3] && 0 == m[8] && 0 == m[13] && 0 == m[15] && 0 == m[16] && 0 == m[17] && 0 == m[19]
          ? this.filter.colorMatrix.SHADER.WITHOUT_ALPHA
          : this.filter.colorMatrix.SHADER.WITH_ALPHA;

      const program = this.compileShader(shader);
      this.gl.uniform1fv(program.uniform.m, m);
      this.draw();
    };

    this.filter.colorMatrix.SHADER = {};
    this.filter.colorMatrix.SHADER.WITH_ALPHA = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D texture;",
      "uniform float m[20];",

      "void main(void) {",
      "vec4 c = texture2D(texture, vUv);",
      "gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[3] * c.a + m[4];",
      "gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[8] * c.a + m[9];",
      "gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[13] * c.a + m[14];",
      "gl_FragColor.a = m[15] * c.r + m[16] * c.g + m[17] * c.b + m[18] * c.a + m[19];",
      "}",
    ].join("\n");
    this.filter.colorMatrix.SHADER.WITHOUT_ALPHA = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D texture;",
      "uniform float m[20];",

      "void main(void) {",
      "vec4 c = texture2D(texture, vUv);",
      "gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[4];",
      "gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[9];",
      "gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[14];",
      "gl_FragColor.a = c.a;",
      "}",
    ].join("\n");

    this.filter.brightness = (brightness) => {
      const b = (brightness || 0) + 1;
      this.filter.colorMatrix([b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0]);
    };

    this.filter.saturation = (amount) => {
      const x = ((amount || 0) * 2) / 3 + 1;
      const y = (x - 1) * -0.5;
      this.filter.colorMatrix([x, y, y, 0, 0, y, x, y, 0, 0, y, y, x, 0, 0, 0, 0, 0, 1, 0]);
    };

    this.filter.desaturate = () => {
      this.filter.saturation(-1);
    };

    this.filter.contrast = (amount) => {
      const v = (amount || 0) + 1;
      const o = -128 * (v - 1);

      this.filter.colorMatrix([v, 0, 0, 0, o, 0, v, 0, 0, o, 0, 0, v, 0, o, 0, 0, 0, 1, 0]);
    };

    this.filter.negative = () => {
      this.filter.contrast(-2);
    };

    this.filter.hue = (rotation) => {
      rotation = ((rotation || 0) / 180) * Math.PI;
      const cos = Math.cos(rotation),
        sin = Math.sin(rotation),
        lumR = 0.213,
        lumG = 0.715,
        lumB = 0.072;

      this.filter.colorMatrix([
        lumR + cos * (1 - lumR) + sin * -lumR,
        lumG + cos * -lumG + sin * -lumG,
        lumB + cos * -lumB + sin * (1 - lumB),
        0,
        0,
        lumR + cos * -lumR + sin * 0.143,
        lumG + cos * (1 - lumG) + sin * 0.14,
        lumB + cos * -lumB + sin * -0.283,
        0,
        0,
        lumR + cos * -lumR + sin * -(1 - lumR),
        lumG + cos * -lumG + sin * lumG,
        lumB + cos * (1 - lumB) + sin * lumB,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.desaturateLuminance = () => {
      this.filter.colorMatrix([
        0.2764723,
        0.929708,
        0.0938197,
        0,
        -37.1,
        0.2764723,
        0.929708,
        0.0938197,
        0,
        -37.1,
        0.2764723,
        0.929708,
        0.0938197,
        0,
        -37.1,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.sepia = () => {
      this.filter.colorMatrix([
        0.393,
        0.7689999,
        0.18899999,
        0,
        0,
        0.349,
        0.6859999,
        0.16799999,
        0,
        0,
        0.272,
        0.5339999,
        0.13099999,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.brownie = () => {
      this.filter.colorMatrix([
        0.5997023498159715,
        0.34553243048391263,
        -0.2708298674538042,
        0,
        47.43192855600873,
        -0.037703249837783157,
        0.8609577587992641,
        0.15059552388459913,
        0,
        -36.96841498319127,
        0.24113635128153335,
        -0.07441037908422492,
        0.44972182064877153,
        0,
        -7.562075277591283,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.vintagePinhole = () => {
      this.filter.colorMatrix([
        0.6279345635605994,
        0.3202183420819367,
        -0.03965408211312453,
        0,
        9.651285835294123,
        0.02578397704808868,
        0.6441188644374771,
        0.03259127616149294,
        0,
        7.462829176470591,
        0.0466055556782719,
        -0.0851232987247891,
        0.5241648018700465,
        0,
        5.159190588235296,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.kodachrome = () => {
      this.filter.colorMatrix([
        1.1285582396593525,
        -0.3967382283601348,
        -0.03992559172921793,
        0,
        63.72958762196502,
        -0.16404339962244616,
        1.0835251566291304,
        -0.05498805115633132,
        0,
        24.732407896706203,
        -0.16786010706155763,
        -0.5603416277695248,
        1.6014850761964943,
        0,
        35.62982807460946,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.technicolor = () => {
      this.filter.colorMatrix([
        1.9125277891456083,
        -0.8545344976951645,
        -0.09155508482755585,
        0,
        11.793603434377337,
        -0.3087833385928097,
        1.7658908555458428,
        -0.10601743074722245,
        0,
        -70.35205161461398,
        -0.231103377548616,
        -0.7501899197440212,
        1.847597816108189,
        0,
        30.950940869491138,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.polaroid = () => {
      this.filter.colorMatrix([
        1.438,
        -0.062,
        -0.062,
        0,
        0,
        -0.122,
        1.378,
        -0.122,
        0,
        0,
        -0.016,
        -0.016,
        1.483,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ]);
    };

    this.filter.shiftToBGR = () => {
      this.filter.colorMatrix([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
    };

    // -------------------------------------------------------------------------
    // Convolution Filter

    this.filter.convolution = (matrix) => {
      const m = new Float32Array(matrix);
      const pixelSizeX = 1 / this.width;
      const pixelSizeY = 1 / this.height;

      const program = this.compileShader(this.filter.convolution.SHADER);
      this.gl.uniform1fv(program.uniform.m, m);
      this.gl.uniform2f(program.uniform.px, pixelSizeX, pixelSizeY);
      this.draw();
    };

    this.filter.convolution.SHADER = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D texture;",
      "uniform vec2 px;",
      "uniform float m[9];",

      "void main(void) {",
      "vec4 c11 = texture2D(texture, vUv - px);", // top left
      "vec4 c12 = texture2D(texture, vec2(vUv.x, vUv.y - px.y));", // top center
      "vec4 c13 = texture2D(texture, vec2(vUv.x + px.x, vUv.y - px.y));", // top right

      "vec4 c21 = texture2D(texture, vec2(vUv.x - px.x, vUv.y) );", // mid left
      "vec4 c22 = texture2D(texture, vUv);", // mid center
      "vec4 c23 = texture2D(texture, vec2(vUv.x + px.x, vUv.y) );", // mid right

      "vec4 c31 = texture2D(texture, vec2(vUv.x - px.x, vUv.y + px.y) );", // bottom left
      "vec4 c32 = texture2D(texture, vec2(vUv.x, vUv.y + px.y) );", // bottom center
      "vec4 c33 = texture2D(texture, vUv + px );", // bottom right

      "gl_FragColor = ",
      "c11 * m[0] + c12 * m[1] + c22 * m[2] +",
      "c21 * m[3] + c22 * m[4] + c23 * m[5] +",
      "c31 * m[6] + c32 * m[7] + c33 * m[8];",
      "gl_FragColor.a = c22.a;",
      "}",
    ].join("\n");

    this.filter.detectEdges = () => {
      this.filter.convolution.call(this, [0, 1, 0, 1, -4, 1, 0, 1, 0]);
    };

    this.filter.sobelX = () => {
      this.filter.convolution.call(this, [-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    };

    this.filter.sobelY = () => {
      this.filter.convolution.call(this, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
    };

    this.filter.sharpen = (amount) => {
      const a = amount || 1;
      this.filter.convolution.call(this, [0, -1 * a, 0, -1 * a, 1 + 4 * a, -1 * a, 0, -1 * a, 0]);
    };

    this.filter.emboss = (size) => {
      const s = size || 1;
      this.filter.convolution.call(this, [-2 * s, -1 * s, 0, -1 * s, 1, 1 * s, 0, 1 * s, 2 * s]);
    };

    // -------------------------------------------------------------------------
    // Blur Filter

    this.filter.blur = (size) => {
      const blurSizeX = size / 7 / this.width;
      const blurSizeY = size / 7 / this.height;

      const program = this.compileShader(this.filter.blur.SHADER);

      // Vertical
      this.gl.uniform2f(program.uniform.px, 0, blurSizeY);
      this.draw(this.DRAW.INTERMEDIATE);

      // Horizontal
      this.gl.uniform2f(program.uniform.px, blurSizeX, 0);
      this.draw();
    };

    this.filter.blur.SHADER = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D texture;",
      "uniform vec2 px;",

      "void main(void) {",
      "gl_FragColor = vec4(0.0);",
      "gl_FragColor += texture2D(texture, vUv + vec2(-7.0*px.x, -7.0*px.y))*0.0044299121055113265;",
      "gl_FragColor += texture2D(texture, vUv + vec2(-6.0*px.x, -6.0*px.y))*0.00895781211794;",
      "gl_FragColor += texture2D(texture, vUv + vec2(-5.0*px.x, -5.0*px.y))*0.0215963866053;",
      "gl_FragColor += texture2D(texture, vUv + vec2(-4.0*px.x, -4.0*px.y))*0.0443683338718;",
      "gl_FragColor += texture2D(texture, vUv + vec2(-3.0*px.x, -3.0*px.y))*0.0776744219933;",
      "gl_FragColor += texture2D(texture, vUv + vec2(-2.0*px.x, -2.0*px.y))*0.115876621105;",
      "gl_FragColor += texture2D(texture, vUv + vec2(-1.0*px.x, -1.0*px.y))*0.147308056121;",
      "gl_FragColor += texture2D(texture, vUv                             )*0.159576912161;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 1.0*px.x,  1.0*px.y))*0.147308056121;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 2.0*px.x,  2.0*px.y))*0.115876621105;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 3.0*px.x,  3.0*px.y))*0.0776744219933;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 4.0*px.x,  4.0*px.y))*0.0443683338718;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 5.0*px.x,  5.0*px.y))*0.0215963866053;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 6.0*px.x,  6.0*px.y))*0.00895781211794;",
      "gl_FragColor += texture2D(texture, vUv + vec2( 7.0*px.x,  7.0*px.y))*0.0044299121055113265;",
      "}",
    ].join("\n");

    // -------------------------------------------------------------------------
    // Pixelate Filter

    this.filter.pixelate = (size) => {
      const blurSizeX = size / this.width;
      const blurSizeY = size / this.height;

      const program = this.compileShader(this.filter.pixelate.SHADER);

      // Horizontal
      this.gl.uniform2f(program.uniform.size, blurSizeX, blurSizeY);
      this.draw();
    };

    this.filter.pixelate.SHADER = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform vec2 size;",
      "uniform sampler2D texture;",

      "vec2 pixelate(vec2 coord, vec2 size) {",
      "return floor( coord / size ) * size;",
      "}",

      "void main(void) {",
      "gl_FragColor = vec4(0.0);",
      "vec2 coord = pixelate(vUv, size);",
      "gl_FragColor += texture2D(texture, coord);",
      "}",
    ].join("\n");
  }
}
