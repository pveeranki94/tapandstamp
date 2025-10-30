import { renderStampStrip } from '../src/index.js';

describe('renderStampStrip', () => {
  it('returns a placeholder payload', () => {
    const result = renderStampStrip({ brandingName: 'Demo Cafe', count: 2, total: 8 });
    expect(result.mime).toBe('image/png');
    expect(result.buffer.byteLength).toBe(0);
  });
});
