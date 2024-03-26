varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 uStrength;
uniform vec2 uScreenRes;
uniform float uReducedMotion;
float smoothcircle(vec2 st, float r){
    float dist = distance(st, vec2(0.5));
    return 1.0 - smoothstep(0., r, dist);
}
void main() {
    vec2 uv = vUv;

    // zoom distortion
    float prox = smoothcircle(uv, 1.);
    float zoomStrength = (uStrength.x+uStrength.y)*10.;
    float maxZoomStrength = uReducedMotion > 0.5 ? 0.2 : 0.5;
    zoomStrength = clamp(zoomStrength, 0., maxZoomStrength);
    vec2 zoomedUv = mix(uv, vec2(0.5), prox*zoomStrength);
    vec4 tex = texture2D(tDiffuse, zoomedUv);

    // rgb shift
    if (uReducedMotion < 0.5) {
        float rgbShiftStrength = (uStrength.x+uStrength.y) * 0.3;
        tex.r = texture2D(tDiffuse, zoomedUv + rgbShiftStrength).r;
        tex.b = texture2D(tDiffuse, zoomedUv - rgbShiftStrength).b;
    }

    gl_FragColor = tex;
}