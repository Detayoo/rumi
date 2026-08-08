import { describe, expect, it } from 'vitest';
import { parseSseStream } from './sse';

function streamOf(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

async function collect(text: string) {
  const events = [];
  for await (const event of parseSseStream(streamOf(text))) events.push(event);
  return events;
}

describe('parseSseStream', () => {
  it('parses a single event block', async () => {
    const events = await collect('event: thinking\ndata: {"delta":"hello"}\n\n');
    expect(events).toEqual([{ event: 'thinking', data: { delta: 'hello' } }]);
  });

  it('parses multiple events', async () => {
    const events = await collect(
      'event: thinking\ndata: {"delta":"a"}\n\nevent: done\ndata: {"response":{"answer":"x"}}\n\n',
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: 'thinking', data: { delta: 'a' } });
    expect(events[1]).toEqual({ event: 'done', data: { response: { answer: 'x' } } });
  });

  it('handles events split across chunk boundaries', async () => {
    const events = [];
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: thin'));
        controller.enqueue(new TextEncoder().encode('king\ndata: {"delta"'));
        controller.enqueue(new TextEncoder().encode(':"a"}\n\n'));
        controller.close();
      },
    });
    for await (const event of parseSseStream(stream)) events.push(event);
    expect(events).toEqual([{ event: 'thinking', data: { delta: 'a' } }]);
  });

  it('ignores blocks without data', async () => {
    const events = await collect('event: heartbeat\n\n');
    expect(events).toEqual([]);
  });

  it('defaults the event name to message', async () => {
    const events = await collect('data: {"n":1}\n\n');
    expect(events).toEqual([{ event: 'message', data: { n: 1 } }]);
  });
});
