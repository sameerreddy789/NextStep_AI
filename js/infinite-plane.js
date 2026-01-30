/**
 * Infinite Plane Background - Vanilla JS
 * Ray-marched infinite plane with dynamic checkered pattern
 */

class InfinitePlaneBg {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.planeHeight = options.planeHeight ?? 0;
        this.epsilon = options.epsilon ?? 0.001;
        this.speed = options.speed ?? 1;

        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.rafId = null;

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'display:block;width:100%;height:100%;position:absolute;top:0;left:0;';
        this.container.style.position = 'relative';
        this.container.insertBefore(this.canvas, this.container.firstChild);

        // Get WebGL2 context
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            this.showError('WebGL2 not supported in this browser.');
            return;
        }

        this.setupShaders();
        this.setupGeometry();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.render(0);
    }

    setupShaders() {
        const gl = this.gl;

        // Vertex shader
        const vsSrc = `#version 300 es
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

        // Fragment shader - raymarched plane
        const fsSrc = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_planeHeight;
uniform float u_epsilon;
uniform float u_speed;

out vec4 fragColor;

float sdPlane(vec3 p, float h) {
    return p.y - h;
}

float mapScene(vec3 p) {
    return sdPlane(p, u_planeHeight);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(u_epsilon, 0.0);
    return normalize(vec3(
        mapScene(p + e.xyy) - mapScene(p - e.xyy),
        mapScene(p + e.yxy) - mapScene(p - e.yxy),
        mapScene(p + e.yyx) - mapScene(p - e.yyx)
    ));
}

float rayMarch(vec3 ro, vec3 rd) {
    float d = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * d;
        float dist = mapScene(p);
        if (dist < u_epsilon || d > 20.0) break;
        d += dist;
    }
    return d;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 ro = vec3(0.0, u_planeHeight + 1.5, -1.5) * u_speed;
    vec3 rd = normalize(vec3(uv, 1.0));

    float d = rayMarch(ro, rd);
    vec3 color = vec3(0.02, 0.02, 0.05); // Dark background

    if (d < 20.0) {
        vec3 p = ro + rd * d;
        vec3 n = calcNormal(p);
        vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
        float diff = max(dot(n, lightDir), 0.0);

        // Moving checkered pattern with brand colors
        float check = mod(floor(p.x) + floor(p.z - u_time * u_speed), 2.0);
        vec3 mat = mix(vec3(0.05, 0.05, 0.12), vec3(0.15, 0.12, 0.25), check);

        color = mat * (diff * 0.8 + 0.2);
        
        // Add fog for depth
        float fog = 1.0 - exp(-d * 0.1);
        color = mix(color, vec3(0.02, 0.02, 0.05), fog);
    }

    fragColor = vec4(color, 1.0);
}`;

        // Compile shaders
        const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return;

        // Link program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
            return;
        }

        // Get locations
        this.locations = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            time: gl.getUniformLocation(this.program, 'u_time'),
            planeHeight: gl.getUniformLocation(this.program, 'u_planeHeight'),
            epsilon: gl.getUniformLocation(this.program, 'u_epsilon'),
            speed: gl.getUniformLocation(this.program, 'u_speed')
        };
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    setupGeometry() {
        const gl = this.gl;
        const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render(time) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.locations.time, time * 0.001);
        gl.uniform1f(this.locations.planeHeight, this.planeHeight);
        gl.uniform1f(this.locations.epsilon, this.epsilon);
        gl.uniform1f(this.locations.speed, this.speed);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        this.rafId = requestAnimationFrame((t) => this.render(t));
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;color:white;font-family:monospace;padding:20px;text-align:center;';
        errorDiv.textContent = message;
        this.container.appendChild(errorDiv);
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.canvas) this.canvas.remove();
    }
}

// Auto-initialize if default container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('infinite-plane-bg');
    if (container) {
        new InfinitePlaneBg('infinite-plane-bg', { speed: 0.8 });
    }
});
