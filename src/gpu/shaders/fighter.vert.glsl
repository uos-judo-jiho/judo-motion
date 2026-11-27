#version 300 es
// One instanced quad per visible animation. Each instance reads one primitive texture row.
layout(location=0) in vec4 aTile;   // x, y (pixels, bottom-left origin), grid, row
layout(location=1) in vec2 aState;  // primitive count, dissolve
uniform vec2 uSize;
flat out vec4 vTile; flat out vec2 vState;
void main() {
  vec2 c = vec2(gl_VertexID & 1, gl_VertexID >> 1);
  gl_Position = vec4((aTile.xy + c * aTile.z) / uSize * 2.0 - 1.0, 0.0, 1.0);
  vTile = aTile; vState = aState;
}
