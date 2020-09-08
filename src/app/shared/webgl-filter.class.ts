import {
  bgr,
  blur,
  blurHorizontal,
  blurVertical,
  brightness,
  brownie,
  contrast,
  crt,
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
  tv,
  vignette,
  vintagePinhole,
} from "./filters";
import { CustomWebGLProgram } from "./webgl-program.class";

export class WebGLFilter {
  private gl: WebGLRenderingContext = null;
  private drawCount = 0;
  private sourceTexture: WebGLTexture = null;
  private lastInChain = false;
  private currentFramebufferIndex = -1;
  private tempFramebuffers = [null, null];
  private filterChain: Array<{ fn: Function; args: any[] }> = [];
  private width = -1;
  private height = -1;
  private vertexBuffer: WebGLBuffer = null;
  private program: CustomWebGLProgram = null;
  private offscreen: OffscreenCanvas = null;
  private canvas: HTMLCanvasElement = null;
  private shaderProgramCache: { [key: string]: CustomWebGLProgram } = {};
  private filter: { [key: string]: Function } = {};

  private DRAW = {
    INTERMEDIATE: 1,
  };

  private SHADER = {
    VERTEX_IDENTITY: `
      precision highp float;
      attribute vec2 pos;
      attribute vec2 uv;
      varying vec2 imgCoord; // viewport resolution (in pixels)
      uniform float flipY;
    
      void main(void) {
        imgCoord = uv;
        gl_Position = vec4(pos.x, pos.y * flipY, 0.0, 1.0);
      }
    `,

    FRAGMENT_IDENTITY: `
      precision highp float;
      varying vec2 imgCoord;
      uniform sampler2D texture;

      void main(void) {
        gl_FragColor = texture2D(texture, imgCoord);
      }
    `,
  };

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas");
    this.offscreen = new OffscreenCanvas(width, height);
    this.gl = this.offscreen.getContext("webgl");

    if (!this.gl) {
      throw "[WebGL] Couldn't get WebGL context";
    }

    this.initializePresets();
  }

  private initializePresets() {
    this.registerFilter("bgr", bgr);
    this.registerFilter("blurHorizontal", blurHorizontal);
    this.registerFilter("blurVertical", blurVertical);
    this.registerFilter("blur", blur);
    this.registerFilter("brightness", brightness);
    this.registerFilter("brownie", brownie);
    this.registerFilter("contrast", contrast);
    this.registerFilter("crt", crt);
    this.registerFilter("desaturateLuminance", desaturateLuminance);
    this.registerFilter("desaturate", desaturate);
    this.registerFilter("edges", edges);
    this.registerFilter("emboss", emboss);
    this.registerFilter("hue", hue);
    this.registerFilter("kodachrome", kodachrome);
    this.registerFilter("negative", negative);
    this.registerFilter("pixelate", pixelate);
    this.registerFilter("polaroid", polaroid);
    this.registerFilter("saturate", saturate);
    this.registerFilter("sepia", sepia);
    this.registerFilter("sharpen", sharpen);
    this.registerFilter("sobelHorizontal", sobelHorizontal);
    this.registerFilter("sobelVertical", sobelVertical);
    this.registerFilter("vignette", vignette);
    this.registerFilter("technicolor", technicolor);
    this.registerFilter("tv", tv);
    this.registerFilter("vintagePinhole", vintagePinhole);
  }

  addFilter(name: string, ...args: any[]) {
    const filterFn = this.filter[name];
    this.filterChain.push({ fn: filterFn, args });
  }

  reset() {
    this.filterChain = [];
  }

  apply(imageOrCanvas: HTMLCanvasElement | HTMLImageElement) {
    this.resize(imageOrCanvas);

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

    if (this.filterChain.length == 0) {
      this.compileShader(this.SHADER.FRAGMENT_IDENTITY);
      this.render();
      return this.commitRenderChangesToCanvas();
    }

    for (let currentFilterIndex = 0; currentFilterIndex < this.filterChain.length; currentFilterIndex++) {
      this.lastInChain = currentFilterIndex === this.filterChain.length - 1;
      const filter = this.filterChain[currentFilterIndex];

      filter.fn.apply(this, filter.args || []);
    }

    return this.commitRenderChangesToCanvas();
  }

  private commitRenderChangesToCanvas() {
    var bitmap = this.offscreen.transferToImageBitmap();
    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;
    this.canvas.getContext("bitmaprenderer").transferFromImageBitmap(bitmap);
    return this.canvas;
  }

  private resize(imageOrCanvas: HTMLCanvasElement | HTMLImageElement) {
    const width = imageOrCanvas.width;
    const height = imageOrCanvas.height;

    if (width === this.width && height === this.height) {
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

    return { fbo, texture };
  }

  private render(flags = null) {
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

    this.gl.uniform1f(this.program.uniform.flipY, flipY ? -1 : 1);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private compileShader(fragmentSource: string, vertexSource?: string) {
    if (this.shaderProgramCache[fragmentSource]) {
      this.program = this.shaderProgramCache[fragmentSource];
      this.gl.useProgram(this.program.program);
      return this.program;
    }

    // Compile shaders
    this.program = new CustomWebGLProgram(this.gl, vertexSource || this.SHADER.VERTEX_IDENTITY, fragmentSource);

    const floatSize = Float32Array.BYTES_PER_ELEMENT;
    const vertSize = 4 * floatSize;
    this.gl.enableVertexAttribArray(this.program.attribute.pos);
    this.gl.vertexAttribPointer(this.program.attribute.pos, 2, this.gl.FLOAT, false, vertSize, 0 * floatSize);
    this.gl.enableVertexAttribArray(this.program.attribute.uv);
    this.gl.vertexAttribPointer(this.program.attribute.uv, 2, this.gl.FLOAT, false, vertSize, 2 * floatSize);

    this.shaderProgramCache[fragmentSource] = this.program;
    return this.program;
  }

  private registerFilter(name: string, filter: Function) {
    // pass in "this" context to the filter function
    this.filter[name] = filter.call(this);
  }
}
