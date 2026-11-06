import { createDragSession, type DragResult, type Point } from '@lp-labs/drag-session';

const origin: Point = { x: 0, y: 0 };
const session = createDragSession();
session.begin({ pointerId: 1, origin });
const result: DragResult = session.finish(1, ['item']);
void result;
