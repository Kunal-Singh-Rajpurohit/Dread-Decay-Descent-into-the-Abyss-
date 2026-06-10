export function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function flip(prob: number): boolean {
  return Math.random() < prob;
}

export function uid(): string {
  return Math.random().toString(36).substring(2, 9);
}
