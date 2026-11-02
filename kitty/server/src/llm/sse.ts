// Minimal Server-Sent Events reader for OpenAI-compatible streaming responses.

/** Yields the `data:` payload of each SSE event (multi-line data joined with "\n"). Stops at `[DONE]`. */
export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.search(/\r?\n/)) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + (buffer[nl] === '\r' ? 2 : 1));
        if (line === '') {
          if (data.length) {
            const payload = data.join('\n');
            data = [];
            if (payload.trim() === '[DONE]') return;
            yield payload;
          }
        } else if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''));
        }
        // other fields (event:, id:, retry:, comments) are ignored
      }
      if (done) {
        if (data.length && data.join('\n').trim() !== '[DONE]') yield data.join('\n');
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
