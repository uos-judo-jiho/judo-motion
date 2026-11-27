#version 300 es
// Shares the capsule and depth rules in core/raster.ts.
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uPrims;
flat in vec4 vTile; flat in vec2 vState;
out vec4 frag;
const int LINE = JUDO_LINE;
const int BAYER[16] = int[](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
const vec2 LIGHT = vec2(JUDO_LIGHT_X, JUDO_LIGHT_Y);
int col = -1, own = -1;
float depth = -1e9;
void flush(int tag, int hit, float dist, float unit, float front, float edge, int inner) {
  if (tag < 0) return;
  int o = tag & 7;
  if (hit >= 0) { if (front > depth) { col = hit; own = o; depth = front; } }
  else if (o > 0 && dist <= unit && edge > depth) { col = own == o ? inner : LINE; own = o; depth = edge; }
}
void main() {
  float grid = vTile.z, unit = JUDO_WORLD / grid;
  vec2 cell = floor(gl_FragCoord.xy - vTile.xy);
  cell.y = grid - 1.0 - cell.y;
  ivec2 ic = ivec2(cell);
  if (vState.y > (float(BAYER[(ic.y & 3) * 4 + (ic.x & 3)]) + 0.5) / 16.0) { frag = vec4(0); return; }
  vec2 p = (cell + 0.5) * unit;
  int row = int(vTile.w), count = int(vState.x), tag = -1, hit = -1, inner = 0;
  float best = 1e9, front = -1e9, edge = -1e9;
  for (int i = 0; i < count; i++) {
    vec4 s = texelFetch(uPrims, ivec2(i * 3, row), 0), m = texelFetch(uPrims, ivec2(i * 3 + 1, row), 0), q = texelFetch(uPrims, ivec2(i * 3 + 2, row), 0);
    int tg = int(m.w + 0.5);
    if (tg != tag) { flush(tag, hit, best, unit, front, edge, inner); tag = tg; inner = int(q.w); hit = -1; best = 1e9; front = -1e9; }
    vec2 e = s.zw - s.xy;
    float k = clamp(dot(p - s.xy, e) / max(dot(e, e), 1e-6), 0.0, 1.0);
    vec2 o = p - s.xy - e * k;
    float r = mix(m.x, m.y, k), d = length(o) - r, z = mix(q.x, q.y, k);
    if (d <= 0.0) {
      float surface = z + sqrt(max(0.0, r * r - dot(o, o)));
      if ((tg & JUDO_DEPTH_SORTED_GROUP) == 0 || surface >= front) hit = int(dot(o, LIGHT) < -0.38 * r ? q.z : m.z);
      front = max(front, surface);
    }
    if (d < best) { best = d; edge = z + 0.6 * r; }
  }
  flush(tag, hit, best, unit, front, edge, inner);
  frag = col >= 0 ? vec4(vec3(col >> 16, (col >> 8) & 255, col & 255) / 255.0, 1.0) : vec4(0);
}
