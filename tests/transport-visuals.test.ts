import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeTransportVisualMode, transportColor } from '../src/domain/transportVisuals';

describe('transport visual mapping', () => {
  it('uses the same palette for route badges and map segments across aliases', () => {
    assert.equal(transportColor('bus'), '#0284C7');
    assert.equal(transportColor('trolleybus'), '#10B981');
    assert.equal(transportColor('tram'), '#EF4444');
    assert.equal(transportColor('minibus'), transportColor('marshrutka'));
    assert.equal(transportColor('TRAM'), transportColor('tram'));
  });

  it('falls back safely for unknown modes', () => {
    assert.equal(normalizeTransportVisualMode('unknown-mode'), 'other');
    assert.equal(transportColor('unknown-mode'), '#64748B');
  });
});
