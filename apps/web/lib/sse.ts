/**
 * minimal sse parser for the companion stream — the server emits
 * `event: thinking|text|done|error` + `data: <json>` blocks separated by blank lines.
 */

export interface SseEvent {
  event: string;
  data: unknown;
}

export async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      let event = 'message';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (data !== '') {
        yield { event, data: JSON.parse(data) };
      }
    }
  }
}
