import { describe, it, expect, beforeEach } from 'vitest';
import AozoraParser from '../AozoraParser';
import type { RubyText, Heading, Image, Caption } from '../../../types';

describe('AozoraParser', () => {
  let parser: AozoraParser;

  beforeEach(() => {
    parser = new AozoraParser();
  });

  describe('ルビ記法の解析', () => {
    it('should parse basic ruby notation', () => {
      const text = '学校《がっこう》で勉強する';
      const result = parser.parse(text, 'test.txt');

      // Find ruby element in the results
      const rubyElement = result.elements.find(
        e => e.type === 'ruby'
      ) as RubyText;
      expect(rubyElement).toBeDefined();
      expect(rubyElement).toMatchObject({
        type: 'ruby',
        text: '校',
        ruby: 'がっこう',
      } as RubyText);
    });

    it('should parse ruby notation with range marker', () => {
      const text = '｜我輩《わがはい》は猫である';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements[0]).toMatchObject({
        type: 'ruby',
        text: '我輩',
        ruby: 'わがはい',
      } as RubyText);
    });

    it('should handle multiple ruby in same line', () => {
      const text = '東京《とうきょう》から大阪《おおさか》まで';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements.filter(e => e.type === 'ruby')).toHaveLength(2);
    });

    it('should parse single character ruby without range marker', () => {
      const text = '私《わたし》は猫《ねこ》である';
      const result = parser.parse(text, 'test.txt');

      const rubyElements = result.elements.filter(
        e => e.type === 'ruby'
      ) as RubyText[];
      expect(rubyElements).toHaveLength(2);
      expect(rubyElements[0]).toMatchObject({
        type: 'ruby',
        text: '私',
        ruby: 'わたし',
      });
      expect(rubyElements[1]).toMatchObject({
        type: 'ruby',
        text: '猫',
        ruby: 'ねこ',
      });
    });

    it('should prioritize range marker over single character ruby', () => {
      const text = '｜我輩《わがはい》は猫《ねこ》である';
      const result = parser.parse(text, 'test.txt');

      const rubyElements = result.elements.filter(
        e => e.type === 'ruby'
      ) as RubyText[];
      expect(rubyElements).toHaveLength(2);
      expect(rubyElements[0]).toMatchObject({
        type: 'ruby',
        text: '我輩',
        ruby: 'わがはい',
      });
      expect(rubyElements[1]).toMatchObject({
        type: 'ruby',
        text: '猫',
        ruby: 'ねこ',
      });
    });

    it('should handle consecutive single character ruby on same line', () => {
      const text = '本《ほん》と雑誌《ざっし》を読《よ》む';
      const result = parser.parse(text, 'test.txt');

      const rubyElements = result.elements.filter(
        e => e.type === 'ruby'
      ) as RubyText[];
      expect(rubyElements).toHaveLength(3);
      expect(rubyElements[0].text).toBe('本');
      expect(rubyElements[1].text).toBe('誌');
      expect(rubyElements[2].text).toBe('読');
    });
  });

  describe('見出し記法の解析', () => {
    it('should parse large heading', () => {
      const text = '第一章　始まり［＃「第一章　始まり」は大見出し］';
      const result = parser.parse(text, 'test.txt');

      const heading = result.elements[0] as Heading;
      expect(heading).toMatchObject({
        type: 'heading',
        level: 'large',
        text: '第一章　始まり',
      });
      expect(result.headings).toHaveLength(1);
    });

    it('should parse medium heading', () => {
      const text = '一　出会い［＃「一　出会い」は中見出し］';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements[0]).toMatchObject({
        type: 'heading',
        level: 'medium',
        text: '一　出会い',
      } as Heading);
    });

    it('should parse small heading', () => {
      const text = 'その後［＃「その後」は小見出し］';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements[0]).toMatchObject({
        type: 'heading',
        level: 'small',
        text: 'その後',
      } as Heading);
    });

    it('should generate heading IDs for navigation', () => {
      const text = '第一章　始まり［＃「第一章　始まり」は大見出し］';
      const result = parser.parse(text, 'test.txt');

      const heading = result.elements[0] as Heading;
      expect(heading.id).toBeTruthy();
      expect(typeof heading.id).toBe('string');
    });
  });

  describe('画像記法の解析', () => {
    it('should parse image notation', () => {
      const text = '［＃石鏃二つの図（fig42154_01.png、横321×縦123）入る］';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements[0]).toMatchObject({
        type: 'image',
        description: '石鏃二つの図',
        filename: 'fig42154_01.png',
        width: 321,
        height: 123,
      } as Image);
    });

    it('should parse image without dimensions', () => {
      const text = '［＃挿絵（image001.png）入る］';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements[0]).toMatchObject({
        type: 'image',
        description: '挿絵',
        filename: 'image001.png',
      } as Image);
    });

    it('should collect all images in document', () => {
      const text = '［＃図1（img1.png）入る］text［＃図2（img2.png）入る］';
      const result = parser.parse(text, 'test.txt');

      expect(result.images).toHaveLength(2);
      expect(result.images[0].filename).toBe('img1.png');
      expect(result.images[1].filename).toBe('img2.png');
    });
  });

  describe('キャプション記法の解析', () => {
    it('should parse caption notation', () => {
      const text = '図1　石器の変遷［＃「図1　石器の変遷」はキャプション］';
      const result = parser.parse(text, 'test.txt');

      expect(result.elements[0]).toMatchObject({
        type: 'caption',
        text: '図1　石器の変遷',
      } as Caption);
    });
  });

  describe('複合記法の処理', () => {
    it('should parse mixed notations in single text', () => {
      const text = `第一章［＃「第一章」は大見出し］
      吾輩《わがはい》は猫である。
      ［＃挿絵（neko.png）入る］
      挿絵1［＃「挿絵1」はキャプション］`;

      const result = parser.parse(text, 'test.txt');

      expect(result.elements.some(e => e.type === 'heading')).toBe(true);
      expect(result.elements.some(e => e.type === 'ruby')).toBe(true);
      expect(result.elements.some(e => e.type === 'image')).toBe(true);
      expect(result.elements.some(e => e.type === 'caption')).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('should handle malformed ruby notation gracefully', () => {
      const text = '学校《がっこう で勉強する'; // 閉じ括弧なし
      const result = parser.parse(text, 'test.txt');

      // 不正な記法は通常テキストとして扱う
      expect(result.elements.every(e => e.type === 'text')).toBe(true);
    });

    it('should handle malformed heading notation gracefully', () => {
      const text = '第一章［＃「第一章」は大見出し'; // 閉じ括弧なし
      const result = parser.parse(text, 'test.txt');

      expect(result.elements.every(e => e.type === 'text')).toBe(true);
    });

    it('should handle empty input', () => {
      const result = parser.parse('', 'test.txt');

      expect(result.elements).toHaveLength(0);
      expect(result.headings).toHaveLength(0);
      expect(result.images).toHaveLength(0);
    });

    it('should parse partially corrupted file', () => {
      const text = '正常な文章［＃不正な記法《破損した内容》正常な続き';
      const result = parser.parse(text, 'test.txt');

      // 解析可能な部分のみが処理されること
      expect(result.elements.length).toBeGreaterThan(0);
    });
  });

  describe('メタデータ生成', () => {
    it('should generate document metadata', () => {
      const text = '第一章［＃「第一章」は大見出し］テスト内容';
      const result = parser.parse(text, 'test.txt');

      expect(result.metadata).toMatchObject({
        filename: 'test.txt',
        fileSize: text.length,
        elementCount: expect.any(Number),
        characterCount: text.length,
      });
    });

    it('should extract title from first large heading', () => {
      const text = '吾輩は猫である［＃「吾輩は猫である」は大見出し］本文...';
      const result = parser.parse(text, 'test.txt');

      expect(result.title).toBe('吾輩は猫である');
    });
  });

  describe('パフォーマンス要件', () => {
    it('should parse large file within time limit', () => {
      const largeText = '吾輩《わがはい》は猫である。'.repeat(200);

      const startTime = performance.now();
      const result = parser.parse(largeText, 'large.txt');
      const endTime = performance.now();

      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(3000); // 3秒以内
      expect(result.elements.length).toBeGreaterThan(0);
    });
  });
});
