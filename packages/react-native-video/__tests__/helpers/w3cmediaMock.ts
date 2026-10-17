// A fake `@amazon-devices/react-native-w3cmedia` VideoPlayer for the Vega backend.
// Like nativeMocks.ts, the module mock is registered once per process; tests drive the
// fakes through the exported state. Import it before the Vega modules under test.
import { mock } from 'bun:test';

type Listener = () => void;

export const w3c = {
  /** Players created by the backend, oldest first. */
  created: [] as FakeW3cPlayer[],
  /** When true, initialize() waits for `finishInit()`. */
  holdInit: false,
  /** When set, initialize() rejects with it. */
  initRejects: null as unknown,
  componentInstance: { name: 'app' } as unknown,
  /** Props of the last rendered KeplerVideoSurfaceView. */
  surface: null as null | {
    onSurfaceViewCreated: (handle: string) => void;
    onSurfaceViewDestroyed: (handle: string) => void;
  },
  /** Listeners added with addAppStateListener('change', …). */
  appState: new Set<(state: string) => void>(),
};

export function resetW3c() {
  w3c.created = [];
  w3c.holdInit = false;
  w3c.initRejects = null;
  w3c.surface = null;
  w3c.appState.clear();
}

export class FakeW3cPlayer {
  /** Calls in order: initialize, src=…, setSurfaceHandle(…), play, … */
  calls: string[] = [];
  autoplay = true;
  loop = false;
  muted = false;
  volume = 1;
  playbackRate = 1;
  duration = NaN;
  paused = true;
  seeking = false;
  readyState = 0;
  videoWidth = 0;
  videoHeight = 0;
  error: { code: number; message?: string } | null = null;
  buffered = { length: 0, start: () => 0, end: () => 0 };
  private _src = '';
  private _currentTime = 0;
  private _finishInit: (() => void) | null = null;
  private listeners = new Map<string, Set<Listener>>();

  constructor() {
    w3c.created.push(this);
  }

  initialize(): Promise<void> {
    this.calls.push('initialize');
    if (w3c.initRejects) return Promise.reject(w3c.initRejects);
    if (!w3c.holdInit) return Promise.resolve();
    return new Promise((resolve) => (this._finishInit = resolve));
  }

  async finishInit(): Promise<void> {
    this._finishInit?.();
    await flush();
  }

  async deinitialize(): Promise<void> {
    this.calls.push('deinitialize');
  }

  setSurfaceHandle(handle: string) {
    this.calls.push(`setSurfaceHandle(${handle})`);
  }

  clearSurfaceHandle(handle: string) {
    this.calls.push(`clearSurfaceHandle(${handle})`);
  }

  async setMediaControlFocus(instance: unknown): Promise<void> {
    this.calls.push(
      `setMediaControlFocus(${(instance as { name?: string })?.name})`
    );
  }

  async play(): Promise<void> {
    this.calls.push('play');
  }

  pause() {
    this.calls.push('pause');
  }

  setSrcWithCustomHeaders(url: string, headers?: Record<string, string>) {
    this.calls.push(`src=${url} headers=${JSON.stringify(headers)}`);
    this._src = url;
  }

  removeAttribute(name: string) {
    this.calls.push(`removeAttribute(${name})`);
    if (name === 'src') this._src = '';
  }

  load() {
    this.calls.push('load');
  }

  get src() {
    return this._src;
  }
  set src(value: string) {
    this.calls.push(`src=${value}`);
    this._src = value;
  }

  get currentTime() {
    return this._currentTime;
  }
  set currentTime(value: number) {
    this.calls.push(`currentTime=${value}`);
    this._currentTime = value;
  }

  /** Moves the playhead without a seek, as playback does. */
  setTime(value: number) {
    this._currentTime = value;
  }

  addEventListener(type: string, listener: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  listenerCount(): number {
    let count = 0;
    this.listeners.forEach((set) => (count += set.size));
    return count;
  }

  emit(type: string) {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

export async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

mock.module('@amazon-devices/react-native-w3cmedia', () => ({
  VideoPlayer: FakeW3cPlayer,
  KeplerVideoSurfaceView: (props: typeof w3c.surface) => {
    w3c.surface = props;
    return null;
  },
}));

mock.module('@amazon-devices/react-native-kepler', () => ({
  useKeplerAppStateManager: () => ({
    getComponentInstance: () => w3c.componentInstance,
    addAppStateListener: (
      _event: string,
      listener: (state: string) => void
    ) => {
      w3c.appState.add(listener);
      return { remove: () => w3c.appState.delete(listener) };
    },
  }),
}));
