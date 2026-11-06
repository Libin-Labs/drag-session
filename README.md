# @lp-labs/drag-session

Pointer-independent drag geometry and bounded selection sessions. Pass coordinates from the
coordinate space of your choice and handle pointer capture/rendering in an adapter. No browser
globals, runtime dependencies, or peer dependencies.

## Install

```bash
npm install @lp-labs/drag-session
```

Node 18+, strict TypeScript declarations, ESM and CommonJS builds.

## Quickstart

```js
import { createDragSession } from '@lp-labs/drag-session';

const drag = createDragSession();
drag.begin({ pointerId: 7, origin: { x: 20, y: 30 }, selected: ['existing'] });
drag.update(7, { x: 5, y: 10 });
const result = drag.finish(7, ['item-a', 'item-b'], 'add');
if (result.selection.join(',') !== 'existing,item-a,item-b') {
  throw new Error('Drag selection failed');
}
```

## Public APIs and types

- `createDragSession()` returns a `DragSession` with `begin`, `update`, `finish`, `cancel`,
  `snapshot`, and read-only `active`.
- `Point` is finite `{ x, y }` numeric data. `DragRect` normalizes endpoints into left/top/right/
  bottom coordinates. `DragStart` requires a string or safe-integer `pointerId`, an `origin`, and
  optional `selected` IDs.
- `DragSnapshot` copies pointer, origin/current coordinates, normalized rect, and original selection.
  `DragResult` adds the selected `mode` and copied hit IDs. `SelectionMode` is `replace`, `add`, or
  `subtract`.
- `DragSessionError` identifies `active`, `inactive`, and `pointer` state errors. The
  runtime exports are `createDragSession` and `DragSessionError`.

`finish` takes hit IDs from a caller-owned hit-test adapter and computes the resulting selection.
`cancel` discards the in-progress operation and returns its last snapshot; with no active drag it
returns `null`. A mismatched pointer cannot move, finish, or cancel another pointer's session.

## Customization

Use your platform's pointer events and hit testing, then pass the resulting IDs:

```js
import { createDragSession } from '@lp-labs/drag-session';

const drag = createDragSession();
drag.begin({ pointerId: 'mouse-1', origin: { x: 2, y: 3 } });
drag.update('mouse-1', { x: 8, y: 9 });
const result = drag.finish('mouse-1', ['target']);
if (result.rect.right !== 8 || result.selection[0] !== 'target') {
  throw new Error('Normalized drag result was incorrect');
}
```

## Limits and errors

Selections are limited to 10,000 unique nonempty IDs of at most 256 units. Points require finite
coordinates. Invalid shapes/IDs/modes throw `TypeError`; unsafe numeric pointer IDs or oversized
selections throw `RangeError`. Concurrent `begin` throws `DragSessionError('active')`. Invalid updates do not
change the last valid coordinates. Rectangles are inclusive geometry descriptions only: no DOM
targeting, hit testing, pointer capture, autoscroll, gesture arbitration, or selection model is
included.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
