import {
  ascii,
  bgr,
  blur,
  blurHorizontal,
  blurVertical,
  brightness,
  brownie,
  chromaKey,
  contrast,
  crt,
  desaturate,
  desaturateLuminance,
  edges,
  emboss,
  hue,
  kodachrome,
  negative,
  noop,
  pixelate,
  polaroid,
  saturate,
  sepia,
  sharpen,
  sobelHorizontal,
  sobelVertical,
  technicolor,
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
  private filterChain: Array<{ fn: Function; id: string; args: any[] }> = [];
  private width = -1;
  private height = -1;
  private vertexBuffer: WebGLBuffer = null;
  private program: CustomWebGLProgram = null;
  private offscreen: OffscreenCanvas = null;
  private canvas: HTMLCanvasElement = null;
  private shaderProgramCache: { [key: string]: CustomWebGLProgram } = {};
  private registeredFilters: { [key: string]: Function } = {};

  private DRAW = {
    INTERMEDIATE: 1,
  };

  private SHADER = {
    VERTEX_IDENTITY: `
      precision highp float;
      
      attribute vec2 pos;
      attribute vec2 uv;
      
      varying vec2 imgCoord;

      uniform float flipHorizontal;
      uniform float flipVertical;
    
      void main(void) {
        imgCoord = uv;
        gl_Position = vec4(pos.x * flipHorizontal, pos.y * flipVertical, 0.0, 1.0);
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
    [
      ["ascii", ascii],
      ["bgr", bgr],
      ["blurHorizontal", blurHorizontal],
      ["blurVertical", blurVertical],
      ["blur", blur],
      ["brightness", brightness],
      ["brownie", brownie],
      ["chromaKey", chromaKey],
      ["contrast", contrast],
      ["crt", crt],
      ["desaturateLuminance", desaturateLuminance],
      ["desaturate", desaturate],
      ["edges", edges],
      ["emboss", emboss],
      ["hue", hue],
      ["kodachrome", kodachrome],
      ["negative", negative],
      ["noop", noop],
      ["pixelate", pixelate],
      ["polaroid", polaroid],
      ["saturate", saturate],
      ["sepia", sepia],
      ["sharpen", sharpen],
      ["sobelHorizontal", sobelHorizontal],
      ["sobelVertical", sobelVertical],
      ["vignette", vignette],
      ["technicolor", technicolor],
      ["vintagePinhole", vintagePinhole],
    ].forEach((filter: any[]) => this.registerFilter(filter[0], filter[1]));
  }

  addFilter(id: string, ...args: any[]) {
    const filterFn = this.registeredFilters[id];
    this.filterChain.push({ fn: filterFn, id, args });
  }

  reset() {
    this.filterChain = [];
  }

  // Note: this method runs inside the rAF loop
  render(imageOrCanvas: HTMLCanvasElement | HTMLImageElement) {
    this.drawCount = 0;
    this.resize(imageOrCanvas);

    if (this.filterChain.length == 0) {
      this.compileShader(this.SHADER.FRAGMENT_IDENTITY);
      this.apply();
      return this.commitRenderingChangesToCanvas();
    }

    // Create the texture for the input images if we haven't yet
    if (!this.sourceTexture) {
      this.sourceTexture = this.gl.createTexture();
    }
    this.initializeTexture(this.sourceTexture, imageOrCanvas);

    for (let currentFilterIndex = 0; currentFilterIndex < this.filterChain.length; currentFilterIndex++) {
      this.lastInChain = currentFilterIndex === this.filterChain.length - 1;
      const filter = this.filterChain[currentFilterIndex];
      try {
        filter.fn.apply(this, filter.args || []);
      } catch (error) {
        console.error(`"[WebGL::Filter] Couldn't apply filter "${filter.id}"`, error);
      }
    }

    return this.commitRenderingChangesToCanvas();
  }

  private initializeTexture(sourceTexture: WebGLTexture, textureData: HTMLCanvasElement | HTMLImageElement) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture);

    // Set the parameters so we can render any size image
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    // Upload the image into the texture
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, textureData);
  }

  private commitRenderingChangesToCanvas() {
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
      this.vertexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
      this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }

    this.gl.viewport(0, 0, this.width, this.height);

    // Delete old temp framebuffers
    this.tempFramebuffers = [null, null];
  }

  private getCachedFrameBuffer(index: number) {
    this.tempFramebuffers[index] =
      this.tempFramebuffers[index] || this.createFramebufferTexture(this.width, this.height);

    return this.tempFramebuffers[index];
  }

  private createFramebufferTexture(width: number, height: number) {
    const frameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);

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

    return { frameBuffer, texture };
  }

  private apply(flags: number = null, flipHorizontal = true) {
    let source = null;
    let target = null;
    let flipVertical = false;

    // Set up the source
    if (this.drawCount == 0) {
      // First draw call - use the source texture
      source = this.sourceTexture;
    } else {
      // All following draw calls use the temp buffer last drawn to
      source = this.getCachedFrameBuffer(this.currentFramebufferIndex).texture;
    }
    this.drawCount++;

    // Set up the target
    if (this.lastInChain && !(flags & this.DRAW.INTERMEDIATE)) {
      // Last filter in our chain - draw directly to the WebGL Canvas. We may
      // also have to flip the image vertically now
      target = null;
      flipVertical = this.drawCount % 2 === 0;
      // should we flip horizontally?
      flipHorizontal = flipVertical !== flipHorizontal;
    } else {
      // Intermediate draw call - get a temp buffer to draw to
      this.currentFramebufferIndex = (this.currentFramebufferIndex + 1) % 2;
      target = this.getCachedFrameBuffer(this.currentFramebufferIndex).frameBuffer;
    }

    // Bind the source and target and draw the two triangles
    this.gl.bindTexture(this.gl.TEXTURE_2D, source);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

    this.gl.uniform1f(this.program.uniform.flipHorizontal, flipHorizontal ? -1.0 : 1.0);
    this.gl.uniform1f(this.program.uniform.flipVertical, flipVertical ? -1.0 : 1.0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private compileShader(fragmentSource: string, vertexSource?: string) {
    if (this.shaderProgramCache[fragmentSource]) {
      this.program = this.shaderProgramCache[fragmentSource];
      this.gl.useProgram(this.program.program);
      return this.program;
    }

    // Compile shaders
    this.program = new CustomWebGLProgram(
      this.gl,
      vertexSource || this.SHADER.VERTEX_IDENTITY,
      fragmentSource || this.SHADER.FRAGMENT_IDENTITY
    );

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
    this.registeredFilters[name] = filter.call(this);
  }
}
