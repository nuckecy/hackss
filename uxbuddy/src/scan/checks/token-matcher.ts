import type { TokenEntry } from '../../types/knowledge';

export interface TokenMatch {
  match: string | null;
  suggestion: string | null;
  suggestedValue?: number;
}

export class TokenLookup {
  private colors: Map<string, string>;
  private spacing: Map<number, string>;
  private radii: Map<number, string>;
  private fontSizes: Map<number, string>;
  private spacingValues: number[];
  private radiiValues: number[];
  private fontSizeValues: number[];

  constructor(tokens: TokenEntry[]) {
    this.colors = new Map();
    this.spacing = new Map();
    this.radii = new Map();
    this.fontSizes = new Map();

    for (const token of tokens) {
      switch (token.category) {
        case 'color':
          this.indexColor(token);
          break;
        case 'spacing':
          this.indexSpacing(token);
          break;
        case 'radius':
          this.indexRadius(token);
          break;
        case 'typography':
          this.indexTypography(token);
          break;
      }
    }

    this.spacingValues = Array.from(this.spacing.keys()).sort((a, b) => a - b);
    this.radiiValues = Array.from(this.radii.keys()).sort((a, b) => a - b);
    this.fontSizeValues = Array.from(this.fontSizes.keys()).sort((a, b) => a - b);
  }

  private indexColor(token: TokenEntry): void {
    const hexMatches = token.value.match(/#[0-9A-Fa-f]{6}/g);
    if (hexMatches) {
      for (const hex of hexMatches) {
        this.colors.set(hex.toLowerCase(), token.name);
      }
    }
  }

  private indexSpacing(token: TokenEntry): void {
    const px = parseInt(token.value, 10);
    if (!isNaN(px)) {
      this.spacing.set(px, token.name);
    }
  }

  private indexRadius(token: TokenEntry): void {
    const px = parseInt(token.value, 10);
    if (!isNaN(px)) {
      this.radii.set(px, token.name);
    }
  }

  private indexTypography(token: TokenEntry): void {
    const pxMatch = token.value.match(/^(\d+)px/);
    if (pxMatch) {
      this.fontSizes.set(parseInt(pxMatch[1], 10), token.name);
    }
  }

  private findClosestInScale(
    value: number,
    map: Map<number, string>,
    sorted: number[]
  ): TokenMatch {
    const exact = map.get(value);
    if (exact) return { match: exact, suggestion: exact, suggestedValue: value };

    if (sorted.length === 0) return { match: null, suggestion: null };

    let closest = sorted[0];
    let closestDist = Math.abs(sorted[0] - value);
    for (let i = 1; i < sorted.length; i++) {
      const dist = Math.abs(sorted[i] - value);
      if (dist < closestDist) {
        closestDist = dist;
        closest = sorted[i];
      }
    }

    return {
      match: null,
      suggestion: map.get(closest) || null,
      suggestedValue: closest,
    };
  }

  findClosestToken(
    value: string | number,
    category: 'color' | 'spacing' | 'radius' | 'fontSize'
  ): TokenMatch {
    if (category === 'color') {
      const hex = typeof value === 'string' ? value.toLowerCase() : '';
      const match = this.colors.get(hex) || null;
      return { match, suggestion: match };
    }

    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) return { match: null, suggestion: null };

    switch (category) {
      case 'spacing':
        return this.findClosestInScale(numValue, this.spacing, this.spacingValues);
      case 'radius':
        return this.findClosestInScale(numValue, this.radii, this.radiiValues);
      case 'fontSize':
        return this.findClosestInScale(numValue, this.fontSizes, this.fontSizeValues);
      default:
        return { match: null, suggestion: null };
    }
  }
}
