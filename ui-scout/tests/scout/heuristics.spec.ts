import { test, expect } from '@playwright/test';
import {
  analyzeHeadingStructure,
  analyzeTitle,
  findTextQualityIssues,
} from '../../src/scout/content';
import { classifyImageDefects, isAttrSizeMismatch, shouldIncludeImage } from '../../src/scout/images';
import { dedupeIssues, isSkippableExternalUrl } from '../../src/scout/noise';

test.describe('UI Scout heuristics', () => {
  test('analyzeTitle flags dangling separators', () => {
    const findings = analyzeTitle('Serve Archives -');
    expect(findings.some((f) => f.kind === 'title-punctuation')).toBeTruthy();
  });

  test('findTextQualityIssues catches typos and placeholders', () => {
    const typos = findTextQualityIssues('Please recieve our newsletter teh soon.');
    expect(typos.some((f) => f.kind === 'typo')).toBeTruthy();

    const placeholder = findTextQualityIssues('Welcome to our site. Lorem ipsum dolor sit amet.');
    expect(placeholder.some((f) => f.kind === 'placeholder')).toBeTruthy();
  });

  test('analyzeHeadingStructure detects skipped levels', () => {
    const findings = analyzeHeadingStructure([
      { level: 1, text: 'Main' },
      { level: 3, text: 'Sub section' },
    ]);
    expect(findings.some((f) => f.kind === 'heading-skip')).toBeTruthy();
  });

  test('classifyImageDefects detects stretch and upscale', () => {
    const base = {
      ariaHidden: false,
      role: null,
      complete: true,
      loading: null,
      inViewport: true,
      hiddenByAncestor: false,
    };

    const defects = classifyImageDefects([
      {
        ...base,
        src: 'https://example.com/wide.jpg',
        alt: '',
        naturalWidth: 200,
        naturalHeight: 200,
        displayWidth: 400,
        displayHeight: 200,
        attrWidth: null,
        attrHeight: null,
      },
      {
        ...base,
        src: 'https://example.com/tiny.jpg',
        alt: '',
        naturalWidth: 50,
        naturalHeight: 50,
        displayWidth: 120,
        displayHeight: 120,
        attrWidth: null,
        attrHeight: null,
      },
    ]);

    expect(defects.some((d) => d.kind === 'stretched')).toBeTruthy();
    expect(defects.some((d) => d.kind === 'upscaled')).toBeTruthy();
  });

  test('shouldIncludeImage skips lazy off-screen zero-size thumbnails', () => {
    expect(
      shouldIncludeImage({
        src: 'https://example.com/photo-100x100.png',
        alt: '',
        ariaHidden: false,
        role: null,
        complete: true,
        loading: 'lazy',
        naturalWidth: 100,
        naturalHeight: 100,
        displayWidth: 0,
        displayHeight: 0,
        attrWidth: null,
        attrHeight: null,
        inViewport: false,
        hiddenByAncestor: false,
      }),
    ).toBeFalsy();
  });

  test('isAttrSizeMismatch ignores uniform responsive downscale', () => {
    expect(isAttrSizeMismatch(263, 300, 180, 205)).toBeFalsy();
    expect(isAttrSizeMismatch(240, 300, 180, 180)).toBeTruthy();
  });

  test('dedupeIssues collapses repeat findings', () => {
    const merged = dedupeIssues([
      {
        category: 'a11y',
        severity: 'serious',
        message: 'link-name: Links must have discernible text',
        url: 'https://example.com/a',
        details: 'social icons',
      },
      {
        category: 'a11y',
        severity: 'serious',
        message: 'link-name: Links must have discernible text',
        url: 'https://example.com/b',
        details: 'social icons',
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].details).toContain('repeated on 2 page(s)');
  });

  test('isSkippableExternalUrl skips social hosts', () => {
    expect(isSkippableExternalUrl('https://www.instagram.com/voiceyworld/')).toBeTruthy();
    expect(isSkippableExternalUrl('https://example.com/about')).toBeFalsy();
  });
});
