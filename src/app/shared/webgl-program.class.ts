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