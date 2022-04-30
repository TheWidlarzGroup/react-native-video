// import { RCTEvent } from "react-native-dom";

interface RCTEvent {
    viewTag: number;
    eventName: string;
    coalescingKey: number;

    canCoalesce(): boolean;
    coalesceWithEvent(event: RCTEvent): RCTEvent;

    moduleDotMethod(): string;
    arguments(): Array<any>;
  }

export default class RCTVideoEvent implements RCTEvent {
  viewTag: number;
  eventName: string;
  coalescingKey: number;

  constructor(
    eventName: string,
    reactTag: number,
    coalescingKey: number,
    data: ?Object
  ) {
    this.viewTag = reactTag;
    this.eventName = eventName;
    this.coalescingKey = coalescingKey;
    this.data = data;
  }

  canCoalesce(): boolean {
    return false;
  }

  coalesceWithEvent(event: RCTEvent): RCTEvent {
    return;
  }

  moduleDotMethod(): string {
    return 'RCTEventEmitter.receiveEvent';
  }

  arguments(): Array<any> {
    const args = [
      this.viewTag,
      this.eventName,
      this.data,
    ];
    return args;
  }

  coalescingKey(): number {
    return this.coalescingKey;
  }
}
