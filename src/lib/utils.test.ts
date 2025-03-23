import { describe, it, expect } from 'vitest';
import { isSingleWordOrPhrases } from './utils';

describe('isSingleWordOrPhrases', () => {
  it('should return true for a single word', () => {
    expect(isSingleWordOrPhrases('hello')).toBe(true);
  });

  it('should return true for a phrase with up to 4 words', () => {
    expect(isSingleWordOrPhrases('hello world')).toBe(true);
    expect(isSingleWordOrPhrases('nice to meet')).toBe(true);
    expect(isSingleWordOrPhrases('how are you today')).toBe(true);
  });

  it('should return false for phrases with more than 4 words', () => {
    expect(isSingleWordOrPhrases('this has more than four words')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isSingleWordOrPhrases('')).toBe(false);
  });

  it('should return false for whitespace only', () => {
    expect(isSingleWordOrPhrases('   ')).toBe(false);
  });

  it('should handle extra whitespace correctly', () => {
    expect(isSingleWordOrPhrases('  hello   world  ')).toBe(true);
  });
});