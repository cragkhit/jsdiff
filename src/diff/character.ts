import Diff from './base.js';
import type { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffCharsOptionsAbortable, DiffCharsOptionsNonabortable} from '../types.js';

class CharacterDiff extends Diff<string, string> {
  tokenize(value: string, options: DiffCharsOptionsNonabortable | DiffCharsOptionsAbortable = {}) {
    if (options.intlSegmenter) {
      const segmenter: Intl.Segmenter = options.intlSegmenter;
      if (segmenter.resolvedOptions().granularity !== 'grapheme') {
        throw new Error('The segmenter passed to diffChars must have a granularity of "grapheme"');
      }
      return Array.from(segmenter.segment(value), s => s.segment);
    }
    return Array.from(value);
  }
}

export const characterDiff = new CharacterDiff();

/**
 * diffs two blocks of text, treating each character as a token.
 *
 * ("Characters" here means Unicode code points - the elements you get when you loop over a string with a `for ... of ...` loop.)
 *
 * @returns a list of change objects.
 */
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCallbackNonabortable<string>
): undefined;
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCharsOptionsAbortable & CallbackOptionAbortable<string>
): undefined
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCharsOptionsNonabortable & CallbackOptionNonabortable<string>
): undefined
export function diffChars(
  oldStr: string,
  newStr: string,
  options: DiffCharsOptionsAbortable
): ChangeObject<string>[] | undefined
export function diffChars(
  oldStr: string,
  newStr: string,
  options?: DiffCharsOptionsNonabortable
): ChangeObject<string>[]
export function diffChars(
  oldStr: string,
  newStr: string,
  options?: any
): undefined | ChangeObject<string>[] {
  return characterDiff.diff(oldStr, newStr, options);
}
