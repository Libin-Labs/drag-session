import test from 'node:test';
import assert from 'node:assert/strict';
import { createDragSession, DragSessionError } from '../dist/esm/index.js';

test('geometry is normalized and result selection supports add and subtract', () => {
  const drag = createDragSession();
  drag.begin({ pointerId: 'p', origin: { x: 8, y: 10 }, selected: ['a', 'b'] });
  const moved = drag.update('p', { x: 2, y: 4 });
  assert.deepEqual(moved.rect, { left: 2, top: 4, right: 8, bottom: 10 });
  const result = drag.finish('p', ['b', 'c'], 'add');
  assert.deepEqual(result.selection, ['a', 'b', 'c']);
  assert.equal(drag.active, false);
  drag.begin({ pointerId: 1, origin: { x: 0, y: 0 }, selected: result.selection });
  assert.deepEqual(drag.finish(1, ['a'], 'subtract').selection, ['b', 'c']);
});

test('cancel discards a session and mismatched pointers cannot mutate it', () => {
  const drag = createDragSession();
  drag.begin({ pointerId: 2, origin: { x: 1, y: 1 } });
  assert.throws(() => drag.update(3, { x: 2, y: 2 }), DragSessionError);
  const cancelled = drag.cancel(2);
  assert.equal(cancelled.current.x, 1);
  assert.equal(drag.cancel(), null);
  assert.throws(
    () => drag.finish(2, []),
    (error) => error.code === 'inactive',
  );
});

test('invalid input leaves session state unchanged', () => {
  const drag = createDragSession();
  assert.throws(() => drag.begin({ pointerId: 1, origin: { x: Infinity, y: 0 } }), TypeError);
  assert.throws(
    () => drag.begin({ pointerId: Number.MAX_SAFE_INTEGER + 1, origin: { x: 0, y: 0 } }),
    RangeError,
  );
  drag.begin({ pointerId: 1, origin: { x: 0, y: 0 } });
  assert.throws(() => drag.update(1, { x: NaN, y: 2 }), TypeError);
  assert.throws(() => drag.finish(1, ['a', 'a']), /Duplicate/);
  assert.equal(drag.snapshot().current.x, 0);
  assert.equal(drag.active, true);
});

test('selection modes validate before consuming session', () => {
  const drag = createDragSession();
  drag.begin({ pointerId: 1, origin: { x: 0, y: 0 } });
  assert.throws(() => drag.finish(1, [], 'invalid'), TypeError);
  assert.equal(drag.active, true);
  assert.deepEqual(drag.finish(1, []).selection, []);
});
