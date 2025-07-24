export default class SimplexNoiseOctave {
  static grad3 = [
    { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: -1 }
  ];

  static grad4 = [
    { x: 0, y: 1, z: 1, w: 1 }, { x: 0, y: 1, z: 1, w: -1 }, { x: 0, y: 1, z: -1, w: 1 }, { x: 0, y: 1, z: -1, w: -1 },
    { x: 0, y: -1, z: 1, w: 1 }, { x: 0, y: -1, z: 1, w: -1 }, { x: 0, y: -1, z: -1, w: 1 }, { x: 0, y: -1, z: -1, w: -1 },
    { x: 1, y: 0, z: 1, w: 1 }, { x: 1, y: 0, z: 1, w: -1 }, { x: 1, y: 0, z: -1, w: 1 }, { x: 1, y: 0, z: -1, w: -1 },
    { x: -1, y: 0, z: 1, w: 1 }, { x: -1, y: 0, z: 1, w: -1 }, { x: -1, y: 0, z: -1, w: 1 }, { x: -1, y: 0, z: -1, w: -1 },
    { x: 1, y: 1, z: 0, w: 1 }, { x: 1, y: 1, z: 0, w: -1 }, { x: 1, y: -1, z: 0, w: 1 }, { x: 1, y: -1, z: 0, w: -1 },
    { x: -1, y: 1, z: 0, w: 1 }, { x: -1, y: 1, z: 0, w: -1 }, { x: -1, y: -1, z: 0, w: 1 }, { x: -1, y: -1, z: 0, w: -1 },
    { x: 1, y: 1, z: 1, w: 0 }, { x: 1, y: 1, z: -1, w: 0 }, { x: 1, y: -1, z: 1, w: 0 }, { x: 1, y: -1, z: -1, w: 0 },
    { x: -1, y: 1, z: 1, w: 0 }, { x: -1, y: 1, z: -1, w: 0 }, { x: -1, y: -1, z: 1, w: 0 }, { x: -1, y: -1, z: -1, w: 0 }
  ];

  static p_supply = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125,
    136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92,
    41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116,
    188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207,
    206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
    172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210,
    144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
  ];

  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed = 0) {
    // Seedable LCG
    let state = seed === 0 ? Math.floor(Math.random() * 0x100000000) : seed;
    const rand = () => {
      state = (1664525 * state + 1013904223) & 0xffffffff;
      return state / 0x100000000;
    };

    // Shuffle p_supply
    const p = SimplexNoiseOctave.p_supply.slice();
    const swaps = 400;
    for (let i = 0; i < swaps; i++) {
      const a = Math.floor(rand() * p.length);
      const b = Math.floor(rand() * p.length);
      [p[a], p[b]] = [p[b], p[a]];
    }

    // Build perm and permMod12
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  // Skew/unskew factors
  static F2 = 0.5 * (Math.sqrt(3) - 1);
  static G2 = (3 - Math.sqrt(3)) / 6;
  static F3 = 1 / 3;
  static G3 = 1 / 6;
  static F4 = (Math.sqrt(5) - 1) / 4;
  static G4 = (5 - Math.sqrt(5)) / 20;

  // Helpers
  static fastfloor(x: number) { return x > 0 ? x | 0 : (x | 0) - 1; }

  static dot3(g: { x: number, y: number, z: number }, x: number, y: number, z: number) { return g.x * x + g.y * y + g.z * z; }
  static dot4(g: { x: number, y: number, z: number, w: number }, x: number, y: number, z: number, w: number) { return g.x * x + g.y * y + g.z * z + g.w * w; }

  // 2D noise
  noise2D(xin: number, yin: number) {
    const s = (xin + yin) * SimplexNoiseOctave.F2;
    const i = SimplexNoiseOctave.fastfloor(xin + s);
    const j = SimplexNoiseOctave.fastfloor(yin + s);
    const t = (i + j) * SimplexNoiseOctave.G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + SimplexNoiseOctave.G2;
    const y1 = y0 - j1 + SimplexNoiseOctave.G2;
    const x2 = x0 - 1 + 2 * SimplexNoiseOctave.G2;
    const y2 = y0 - 1 + 2 * SimplexNoiseOctave.G2;

    const ii = i & 255, jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * SimplexNoiseOctave.dot3(SimplexNoiseOctave.grad3[gi0], x0, y0, 0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * SimplexNoiseOctave.dot3(SimplexNoiseOctave.grad3[gi1], x1, y1, 0); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * SimplexNoiseOctave.dot3(SimplexNoiseOctave.grad3[gi2], x2, y2, 0); }

    return 70 * (n0 + n1 + n2);
  }
}

export class SimplexNoise {
  private octaves: SimplexNoiseOctave[];
  private frequencies: number[];
  private amplitudes: number[];

  constructor(largestFeature: number, persistence: number, seed = 0) {
    const octavesCount = Math.ceil(Math.log2(largestFeature));
    this.octaves = Array.from({ length: octavesCount }, () => new SimplexNoiseOctave(seed));
    this.frequencies = new Array<number>(octavesCount);
    this.amplitudes = new Array<number>(octavesCount);
    for (let i = 0; i < octavesCount; i++) {
      this.frequencies[i] = 2 ** i;
      this.amplitudes[i] = persistence ** (octavesCount - i);
    }
  }

  getNoise2D(x: number, y: number) {
    return this.octaves.reduce((sum, oct, i) => {
      return sum + oct.noise2D(x / this.frequencies[i], y / this.frequencies[i]) * this.amplitudes[i];
    }, 0);
  }
}
