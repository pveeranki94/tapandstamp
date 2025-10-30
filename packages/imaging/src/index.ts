import { Buffer } from 'node:buffer';

export interface RenderStampStripOptions {
  brandingName: string;
  count: number;
  total: number;
}

export interface RenderStampStripResult {
  width: number;
  height: number;
  mime: string;
  buffer: Buffer;
}

export function renderStampStrip(_options: RenderStampStripOptions): RenderStampStripResult {
  // TODO: Replace with Sharp/Canvas rendering pipeline.
  return {
    width: 0,
    height: 0,
    mime: 'image/png',
    buffer: Buffer.alloc(0)
  };
}
