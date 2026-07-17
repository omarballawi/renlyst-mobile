import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

import { hasArabicCopy } from '@/localization/copy';

const root = process.cwd();
const copyFile = path.join(root, 'src/localization/copy.ts');
const translatedAttributes = new Set([
  'label',
  'title',
  'subtitle',
  'placeholder',
  'accessibilityLabel',
  'accessibilityHint',
  'eyebrow',
  'body',
  'detail',
  'emptyTitle',
  'emptyBody',
  'description',
  'helper',
  'caption',
  'hint',
]);
const nativeAccessibilityTags = new Set(['View', 'Image', 'Switch']);

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(location);
    return /\.(tsx?|jsx?)$/u.test(entry.name) ? [location] : [];
  });
}

function readableText(value: string): string | null {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  return normalized && /[A-Za-z]/u.test(normalized) ? normalized : null;
}

function isTranslationCall(expression: ts.Expression): boolean {
  if (!ts.isCallExpression(expression)) return false;
  if (ts.isIdentifier(expression.expression)) {
    return expression.expression.text === 't' || expression.expression.text === 'translateCopy';
  }
  return (
    ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === 't'
  );
}

describe('Arabic interface coverage', () => {
  const files = [
    ...sourceFiles(path.join(root, 'app')),
    ...sourceFiles(path.join(root, 'src')),
  ].filter((file) => file !== copyFile);

  it('has catalog coverage for every static user-facing interface string', () => {
    const values = new Set<string>();
    const add = (value: string) => {
      const text = readableText(value);
      if (text) values.add(text);
    };

    for (const file of files) {
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node)) add(node.text);
        if (
          ts.isJsxAttribute(node) &&
          ts.isIdentifier(node.name) &&
          translatedAttributes.has(node.name.text) &&
          node.initializer
        ) {
          const initializer = node.initializer;
          if (ts.isStringLiteral(initializer)) add(initializer.text);
          else if (
            ts.isJsxExpression(initializer) &&
            initializer.expression &&
            (ts.isStringLiteral(initializer.expression) ||
              ts.isNoSubstitutionTemplateLiteral(initializer.expression))
          ) {
            add(initializer.expression.text);
          }
        }
        if (
          ts.isJsxExpression(node) &&
          node.expression &&
          (ts.isStringLiteral(node.expression) ||
            ts.isNoSubstitutionTemplateLiteral(node.expression))
        ) {
          add(node.expression.text);
        }
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 't' &&
          node.arguments[0] &&
          (ts.isStringLiteral(node.arguments[0]) ||
            ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
        ) {
          add(node.arguments[0].text);
        }
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'Alert' &&
          node.expression.name.text === 'alert'
        ) {
          for (const argument of node.arguments.slice(0, 2)) {
            if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
              add(argument.text);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect([...values].filter((value) => !hasArabicCopy(value)).sort()).toEqual([]);
  });

  it('explicitly localizes accessibility copy on native visual controls', () => {
    const misses: string[] = [];
    for (const file of files.filter((candidate) => candidate.endsWith('.tsx'))) {
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isJsxAttribute(node) &&
          ts.isIdentifier(node.name) &&
          (node.name.text === 'accessibilityLabel' || node.name.text === 'accessibilityHint')
        ) {
          const element = node.parent.parent;
          const tag =
            ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element)
              ? element.tagName.getText(source)
              : '';
          if (nativeAccessibilityTags.has(tag)) {
            const initializer = node.initializer;
            const localized =
              initializer != null &&
              ts.isJsxExpression(initializer) &&
              initializer.expression != null &&
              isTranslationCall(initializer.expression);
            if (!localized) {
              const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
              misses.push(`${path.relative(root, file)}:${line}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(misses).toEqual([]);
  });
});
