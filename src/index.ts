export interface Point {
  x: number;
  y: number;
}

export interface DragRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type SelectionMode = 'replace' | 'add' | 'subtract';

export interface DragStart {
  pointerId: string | number;
  origin: Point;
  selected?: Iterable<string>;
}

export interface DragSnapshot {
  pointerId: string | number;
  origin: Point;
  current: Point;
  rect: DragRect;
  selection: string[];
}

export interface DragResult extends DragSnapshot {
  mode: SelectionMode;
  hits: string[];
}

export interface DragSession {
  readonly active: boolean;
  begin(input: DragStart): DragSnapshot;
  update(pointerId: string | number, point: Point): DragSnapshot;
  finish(pointerId: string | number, hits: Iterable<string>, mode?: SelectionMode): DragResult;
  cancel(pointerId?: string | number): DragSnapshot | null;
  snapshot(): DragSnapshot | null;
}

export class DragSessionError extends Error {
  constructor(
    readonly code: 'active' | 'inactive' | 'pointer',
    message: string,
  ) {
    super(message);
    this.name = 'DragSessionError';
  }
}

function point(input: Point): Point {
  if (
    !input ||
    typeof input !== 'object' ||
    typeof input.x !== 'number' ||
    !Number.isFinite(input.x) ||
    typeof input.y !== 'number' ||
    !Number.isFinite(input.y)
  )
    throw new TypeError('Coordinates must be finite x/y numbers.');
  return { x: input.x, y: input.y };
}

function ids(input: Iterable<string>): string[] {
  if (input == null || typeof input[Symbol.iterator] !== 'function')
    throw new TypeError('Expected iterable selection IDs.');
  const result: string[] = [];
  const seen = new Set<string>();
  for (const id of input) {
    if (result.length >= 10_000) throw new RangeError('Selection capacity exceeded.');
    if (typeof id !== 'string' || !id || id.length > 256)
      throw new TypeError('Selection IDs must be nonempty strings up to 256 units.');
    if (seen.has(id)) throw new TypeError(`Duplicate selection ID: ${id}`);
    seen.add(id);
    result.push(id);
  }
  return result;
}

function makeSnapshot(
  pointerId: string | number,
  origin: Point,
  current: Point,
  selection: string[],
): DragSnapshot {
  return {
    pointerId,
    origin: { ...origin },
    current: { ...current },
    rect: {
      left: Math.min(origin.x, current.x),
      top: Math.min(origin.y, current.y),
      right: Math.max(origin.x, current.x),
      bottom: Math.max(origin.y, current.y),
    },
    selection: [...selection],
  };
}

export function createDragSession(): DragSession {
  let active: {
    pointerId: string | number;
    origin: Point;
    current: Point;
    selection: string[];
  } | null = null;
  const requireActive = (pointerId?: string | number) => {
    if (!active) throw new DragSessionError('inactive', 'No drag session is active.');
    if (pointerId !== undefined && pointerId !== active.pointerId)
      throw new DragSessionError('pointer', 'Pointer does not own the active drag session.');
    return active;
  };
  return {
    get active() {
      return active !== null;
    },
    begin(input) {
      if (active) throw new DragSessionError('active', 'A drag session is already active.');
      if (
        !input ||
        typeof input !== 'object' ||
        (typeof input.pointerId !== 'string' && typeof input.pointerId !== 'number') ||
        (typeof input.pointerId === 'string' && (!input.pointerId || input.pointerId.length > 128))
      )
        throw new TypeError('pointerId must be a nonempty string or safe integer.');
      if (typeof input.pointerId === 'number' && !Number.isSafeInteger(input.pointerId))
        throw new RangeError('Numeric pointerId must be a safe integer.');
      const origin = point(input.origin);
      const selection = input.selected === undefined ? [] : ids(input.selected);
      active = { pointerId: input.pointerId, origin, current: origin, selection };
      return makeSnapshot(active.pointerId, origin, origin, selection);
    },
    update(pointerId, input) {
      const state = requireActive(pointerId);
      const current = point(input);
      state.current = current;
      return makeSnapshot(state.pointerId, state.origin, current, state.selection);
    },
    finish(pointerId, input, mode = 'replace') {
      const state = requireActive(pointerId);
      if (!['replace', 'add', 'subtract'].includes(mode))
        throw new TypeError('Unsupported selection mode.');
      const hits = ids(input);
      const currentSelection = new Set(state.selection);
      const next = mode === 'replace' ? new Set(hits) : new Set(currentSelection);
      if (mode === 'add') for (const id of hits) next.add(id);
      if (mode === 'subtract') for (const id of hits) next.delete(id);
      const snapshot = makeSnapshot(state.pointerId, state.origin, state.current, state.selection);
      active = null;
      return { ...snapshot, mode, hits, selection: [...next] };
    },
    cancel(pointerId) {
      if (!active) return null;
      requireActive(pointerId);
      const snapshot = makeSnapshot(
        active.pointerId,
        active.origin,
        active.current,
        active.selection,
      );
      active = null;
      return snapshot;
    },
    snapshot() {
      return active
        ? makeSnapshot(active.pointerId, active.origin, active.current, active.selection)
        : null;
    },
  };
}
