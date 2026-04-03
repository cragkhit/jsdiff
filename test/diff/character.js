import {diffChars} from '../../libesm/diff/character.js';
import {convertChangesToXML} from '../../libesm/convert/xml.js';

import {expect} from 'chai';

describe('diff/character', function() {
  describe('#diffChars', function() {
    it('Should diff chars', function() {
      const diffResult = diffChars('Old Value.', 'New ValueMoreData.');
      expect(convertChangesToXML(diffResult)).to.equal('<del>Old</del><ins>New</ins> Value<ins>MoreData</ins>.');
    });

    describe('oneChangePerToken option', function() {
      it('emits one change per character', function() {
        const diffResult = diffChars('Old Value.', 'New ValueMoreData.', {oneChangePerToken: true});
        expect(diffResult.length).to.equal(21);
        expect(convertChangesToXML(diffResult)).to.equal('<del>O</del><del>l</del><del>d</del><ins>N</ins><ins>e</ins><ins>w</ins> Value<ins>M</ins><ins>o</ins><ins>r</ins><ins>e</ins><ins>D</ins><ins>a</ins><ins>t</ins><ins>a</ins>.');
      });

      it('correctly handles the case where the texts are identical', function() {
        const diffResult = diffChars('foo bar baz qux', 'foo bar baz qux', {oneChangePerToken: true});
        expect(diffResult).to.deep.equal(
          ['f', 'o', 'o', ' ', 'b', 'a', 'r', ' ', 'b', 'a', 'z', ' ', 'q', 'u', 'x'].map(
            char => ({value: char, count: 1, added: false, removed: false})
          )
        );
      });
    });

    it('should treat a code point that consists of two UTF-16 code units as a single character, not two', function() {
      const diffResult = diffChars('𝟘𝟙𝟚𝟛', '𝟘𝟙𝟚𝟜𝟝𝟞');
      expect(diffResult.length).to.equal(3);
      expect(diffResult[2].count).to.equal(3);
      expect(convertChangesToXML(diffResult)).to.equal('𝟘𝟙𝟚<del>𝟛</del><ins>𝟜𝟝𝟞</ins>');
    });

    describe('case insensitivity', function() {
      it("is considered when there's no difference", function() {
        const diffResult = diffChars('New Value.', 'New value.', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New value.');
      });

      it("is considered when there's a difference", function() {
        const diffResult = diffChars('New Values.', 'New value.', {ignoreCase: true});
        expect(convertChangesToXML(diffResult)).to.equal('New value<del>s</del>.');
      });
    });

    describe('intlSegmenter option with granularity "grapheme"', function() {
      it('keeps Thai grapheme clusters (base consonant + combining tone/vowel marks) together as single tokens', function() {
        // In Thai, tone marks (e.g. U+0E49 ้) are combining characters that attach to the
        // preceding consonant. Without a grapheme segmenter, diffChars treats each code point
        // as a separate token, so "ก้า" → ["ก", "้", "า"] and removing the tone mark would
        // produce a floating combining character in the output (broken rendering).
        // With a grapheme segmenter, "ก้า" → ["ก้", "า"] so the cluster stays intact.
        const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });

        // diffChars("ก้า", "กา"): "ก้" (consonant + tone mark) is deleted, plain "ก" inserted, "า" kept.
        const diffResult = diffChars('ก้า', 'กา', { intlSegmenter: segmenter });
        expect(convertChangesToXML(diffResult)).to.equal('<del>ก้</del><ins>ก</ins>า');
      });

      it('handles plain ASCII correctly with a grapheme segmenter', function() {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        const diffResult = diffChars('Old Value.', 'New ValueMoreData.', { intlSegmenter: segmenter });
        expect(convertChangesToXML(diffResult)).to.equal('<del>Old</del><ins>New</ins> Value<ins>MoreData</ins>.');
      });

      it('rejects a segmenter with a non-grapheme granularity', function() {
        const segmenter = new Intl.Segmenter('en', { granularity: 'word' });
        expect(() => {
          diffChars('foo', 'bar', { intlSegmenter: segmenter });
        }).to['throw']('The segmenter passed to diffChars must have a granularity of "grapheme"');
      });
    });

    it('should not be susceptible to race conditions in async mode when called with different options', function(done) {
      // (regression test for https://github.com/kpdecker/jsdiff/issues/477)
      diffChars('wibblywobbly', 'WIBBLYWOBBLY', {ignoreCase: false, callback: (diffResult) => {
        expect(convertChangesToXML(diffResult)).to.equal('<del>wibblywobbly</del><ins>WIBBLYWOBBLY</ins>');
        done();
      }});

      // Historically, doing this while async execution of the previous
      // diffChars call was ongoing would overwrite this.options and make the
      // ongoing diff become case-insensitive partway through execution.
      diffChars('whatever', 'whatever', {ignoreCase: true});
      diffChars('whatever', 'whatever', {ignoreCase: true, callback: () => {}});
    });

    it('should return undefined when called in async mode', function() {
      expect(diffChars('whatever', 'whatever', {callback: () => {}})).to.be.undefined;
      expect(diffChars('whatever', 'whatever else', {callback: () => {}})).to.be.undefined;
    });
  });
});
