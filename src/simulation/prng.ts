/**
 * Deterministic Seeded Pseudo-Random Number Generator (Mulberry32 & Box-Muller Gaussian)
 * Ensures reproducible simulations without Math.random() in UI or simulation engines.
 */

export class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random float in range [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in range [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a normally distributed value with mean and standard deviation (sigma)
   * Using Box-Muller transform
   */
  nextGaussian(mean: number = 0, sigma: number = 1): number {
    const u1 = Math.max(1e-15, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * sigma;
  }

  /**
   * Forks a new generator with a deterministic child seed
   */
  fork(streamId: number): DeterministicPRNG {
    const childSeed = (this.state ^ (streamId * 0x9e3779b9)) >>> 0;
    return new DeterministicPRNG(childSeed);
  }
}
