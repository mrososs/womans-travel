import { createSupabaseClient } from './supabase-client.js';

describe('createSupabaseClient', () => {
  it('throws when url or key is missing', () => {
    expect(() => createSupabaseClient({ url: '', key: '' })).toThrow();
  });

  it('returns a client when given credentials', () => {
    const client = createSupabaseClient({
      url: 'https://example.supabase.co',
      key: 'public-anon-key',
    });
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
