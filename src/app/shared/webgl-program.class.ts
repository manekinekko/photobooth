export class CustomWebGLProgram {
  public uniform: { [key: string]: WebGLUniformLocation } = {};
  public attribute: { [key: string]: number } = {};
  public program: WebGLProgram;

  constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const vertexShader = this.compile(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compile(gl, fragmentSource, gl.FRAGMENT_SHADER);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(`[WebGL::LINK_STATUS]`, gl.getProgramInfoLog(this.program));
      return;
    }

    gl.validateProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.VALIDATE_STATUS)) {
      console.error(`[WebGL::VALIDATE_STATUS]`, gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    // Collect attributes
    this.extract(vertexSource, "attribute", this.attribute);
    for (const a in this.attribute) {
      this.attribute[a] = gl.getAttribLocation(this.program, a);
    }

    // Collect uniforms
    this.extract(vertexSource, "uniform", this.uniform);
    this.extract(fragmentSource, "uniform", this.uniform);
    for (const u in this.uniform) {
      this.uniform[u] = gl.getUniformLocation(this.program, u);
    }
  }

  private extract(source: string, prefix: string, collection: object) {
    const r = new RegExp("\\b" + prefix + " \\w+ (\\w+)", "ig");
    source.replace(r, (match, name) => {
      collection[name] = 0;
      return match;
    });
  }

  private compile(gl: WebGLRenderingContext, source: string, type: number) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`[WebGL::COMPILE_STATUS]`, gl.getShaderInfoLog(shader));
      return;
    }
    return shader;
  }
}
