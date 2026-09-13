import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInventoryDoseTime } from './dose-time.mjs';

test('pets inventory PM does not resolve to 08:00', () => {
  assert.equal(resolveInventoryDoseTime({ dosePeriod: 'PM' }), '20:00');
  assert.equal(resolveInventoryDoseTime({ doseTime: '21:30', dosePeriod: 'PM' }), '21:30');
  assert.equal(resolveInventoryDoseTime({}), undefined);
});
