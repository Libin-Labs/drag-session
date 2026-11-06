import { createDragSession, type DragSession } from '@lp-labs/drag-session';

const session: DragSession = createDragSession();
const isActive: boolean = session.active;
void isActive;
