import {
  bgr,
  blur,
  blurHorizontal,
  blurVertical,
  brightness,
  brownie,
  contrast,
  desaturate,
  desaturateLuminance,
  edges,
  emboss,
  hue,
  kodachrome,
  negative,
  pixelate,
  polaroid,
  saturate,
  sepia,
  sharpen,
  sobelHorizontal,
  sobelVertical,
  technicolor,
  vintagePinhole,
} from "./filters";
import { CustomWebGLProgram } from "./webgl-program.class";

export class WebGLFilter {
  gl: WebGLRenderingContext = null;
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
    VERTEX_IDENTITY: `
      precision highp float;
      attribute vec2 pos;
      attribute vec2 uv;
      varying vec2 vUv;
      uniform float flipY;
    
      void main(void) {
        vUv = uv;
        gl_Position = vec4(pos.x, pos.y*flipY, 0.0, 1.);
      }
    `,

    FRAGMENT_IDENTITY: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D texture;

      void main(void) {
        gl_FragColor = texture2D(texture, vUv);
      }
    `,
  };

  constructor() {
    this.canvas = document.createElement("canvas");
    this.gl = this.canvas.getContext("webgl");

    if (!this.gl) {
      throw "Couldn't get WebGL context";
    }

    this.initializePresets();
  }

  initializePresets() {
    this.registerFilter(bgr);
    this.registerFilter(blurHorizontal);
    this.registerFilter(blurVertical);
    this.registerFilter(blur);
    this.registerFilter(brightness);
    this.registerFilter(brownie);
    this.registerFilter(contrast);
    this.registerFilter(desaturateLuminance);
    this.registerFilter(desaturate);
    this.registerFilter(edges);
    this.registerFilter(emboss);
    this.registerFilter(hue);
    this.registerFilter(kodachrome);
    this.registerFilter(negative);
    this.registerFilter(pixelate);
    this.registerFilter(polaroid);
    this.registerFilter(saturate);
    this.registerFilter(sepia);
    this.registerFilter(sharpen);
    this.registerFilter(sobelHorizontal);
    this.registerFilter(sobelVertical);
    this.registerFilter(technicolor);
    this.registerFilter(vintagePinhole);
  }

  addFilter(name: string, ...args: any[]) {
    const filter = this.filter[name];

    this.filterChain.push({ func: filter, args });
  }

  reset() {
    this.filterChain = [];
  }

  apply(imageOrCanvas: HTMLCanvasElement | HTMLImageElement) {
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

  draw(flags = null) {
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

  compileShader(fragmentSource: string) {
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

  registerFilter(filter: Function) {
    // pass in "this" to the filter function
    this.filter[filter.name] = filter.call(this);
  }
}
