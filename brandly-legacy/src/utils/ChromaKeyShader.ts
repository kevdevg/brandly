/**
 * ChromaKeyShader — WebGL2-based chroma key processor
 * 
 * Uses a GPU fragment shader for real-time background removal.
 * Processes in YCbCr color space for more perceptually accurate
 * color matching, and includes spill suppression + edge refinement.
 * 
 * Falls back gracefully: caller should check `isSupported()` before use.
 */

const VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  in vec2 a_texCoord;
  out vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision mediump float;
  
  in vec2 v_texCoord;
  out vec4 outColor;
  
  uniform sampler2D u_texture;
  uniform vec3 u_keyColor;      // Key color in RGB (0-1 range)
  uniform float u_tolerance;    // Inner tolerance radius (color distance)
  uniform float u_softness;     // Softness zone width
  uniform float u_spillSuppress; // Spill suppression strength (0-1)
  
  // Convert RGB to YCbCr for more perceptual color matching
  vec3 rgbToYCbCr(vec3 rgb) {
    float y  =  0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    float cb = -0.169 * rgb.r - 0.331 * rgb.g + 0.500 * rgb.b + 0.5;
    float cr =  0.500 * rgb.r - 0.419 * rgb.g - 0.081 * rgb.b + 0.5;
    return vec3(y, cb, cr);
  }
  
  void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    
    // Convert to YCbCr space — compare only chroma (Cb, Cr), ignore luminance (Y)
    vec3 texYCbCr = rgbToYCbCr(texColor.rgb);
    vec3 keyYCbCr = rgbToYCbCr(u_keyColor);
    
    // Distance in chroma space only (ignore luminance for better results)
    float chromaDist = distance(texYCbCr.yz, keyYCbCr.yz);
    
    // Also factor in RGB distance for edge cases (pure white/black)
    float rgbDist = distance(texColor.rgb, u_keyColor);
    
    // Use the minimum of both distances for better detection of white/black
    float dist = min(chromaDist * 2.0, rgbDist);
    
    // Smoothstep for clean alpha transition
    float alpha = smoothstep(u_tolerance, u_tolerance + u_softness, dist);
    
    // Spill suppression — reduce key color influence on semi-transparent pixels
    vec3 finalColor = texColor.rgb;
    if (alpha > 0.0 && alpha < 1.0 && u_spillSuppress > 0.0) {
      float spillMask = 1.0 - alpha;
      finalColor = mix(texColor.rgb, 
        texColor.rgb + (texColor.rgb - u_keyColor) * spillMask * 0.5,
        u_spillSuppress);
      finalColor = clamp(finalColor, 0.0, 1.0);
    }
    
    outColor = vec4(finalColor, texColor.a * alpha);
  }
`;

export interface ChromaKeyShaderParams {
  keyColor: [number, number, number]; // RGB 0-255
  tolerance: number;                   // 0-1 range (normalized distance)
  softness: number;                    // 0-1 range
  spillSuppress?: number;              // 0-1 range, default 0.5
}

export class ChromaKeyShader {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private vao: WebGLVertexArrayObject;

  // Uniform locations
  private uTexture: WebGLUniformLocation;
  private uKeyColor: WebGLUniformLocation;
  private uTolerance: WebGLUniformLocation;
  private uSoftness: WebGLUniformLocation;
  private uSpillSuppress: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Compile shaders
    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    
    // Link program
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Shader link failed: ' + gl.getProgramInfoLog(this.program));
    }

    // Get uniform locations
    this.uTexture = gl.getUniformLocation(this.program, 'u_texture')!;
    this.uKeyColor = gl.getUniformLocation(this.program, 'u_keyColor')!;
    this.uTolerance = gl.getUniformLocation(this.program, 'u_tolerance')!;
    this.uSoftness = gl.getUniformLocation(this.program, 'u_softness')!;
    this.uSpillSuppress = gl.getUniformLocation(this.program, 'u_spillSuppress')!;

    // Create texture
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Create fullscreen quad VAO
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // Position buffer (clip space quad)
    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
       1, -1,  1,  1,  -1, 1,
    ]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Texcoord buffer (flip Y for video frames)
    const tcBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, tcBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,  1, 1,  0, 0,
      1, 1,  1, 0,  0, 0,
    ]), gl.STATIC_DRAW);
    const aTex = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Render a source (video or image) with chroma key applied.
   * Updates the canvas size to match the source dimensions.
   */
  render(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    params: ChromaKeyShaderParams
  ): void {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;

    // Get source dimensions
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    
    if (srcW === 0 || srcH === 0) return;

    // Resize canvas if needed
    if (canvas.width !== srcW || canvas.height !== srcH) {
      canvas.width = srcW;
      canvas.height = srcH;
      gl.viewport(0, 0, srcW, srcH);
    }

    // Upload source to texture
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // Set uniforms
    gl.useProgram(this.program);
    gl.uniform1i(this.uTexture, 0);
    gl.uniform3f(
      this.uKeyColor,
      params.keyColor[0] / 255,
      params.keyColor[1] / 255,
      params.keyColor[2] / 255
    );
    gl.uniform1f(this.uTolerance, params.tolerance);
    gl.uniform1f(this.uSoftness, params.softness);
    gl.uniform1f(this.uSpillSuppress, params.spillSuppress ?? 0.5);

    // Clear and draw
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  /**
   * Check if WebGL2 is available in the current browser.
   */
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      canvas.remove();
      return !!gl;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup all WebGL resources.
   */
  dispose(): void {
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile failed: ' + info);
    }
    return shader;
  }
}
