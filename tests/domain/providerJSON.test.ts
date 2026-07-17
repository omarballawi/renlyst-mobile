import { normalizeCredential } from '@/domain/shared/credentials';
import { parseProviderJSON } from '@/services/providers/providerClients';

describe('provider JSON recovery', () => {
  it('normalizes pasted credentials without embedded whitespace', () => {
    expect(normalizeCredential('  sk-test\n 123\t')).toBe('sk-test123');
  });

  it('accepts markdown fences and braces inside JSON strings', () => {
    expect(parseProviderJSON('```json\n{"note":"keep {this} literal","ok":true}\n```')).toEqual({
      note: 'keep {this} literal',
      ok: true,
    });
  });

  it('repairs a safely closable truncated object', () => {
    expect(parseProviderJSON('{"name":"Metformin","items":["a","b"')).toEqual({
      name: 'Metformin',
      items: ['a', 'b'],
    });
  });
});
