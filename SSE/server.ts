import { v4 as uuidv4 } from 'uuid';
import {json, error} from '@sveltejs/kit'

/**
 * A set for session Ids and parameters.
 */
// Coded by Bewinxed, find in https://github.com/Bewinxed/svelte-in-prod
// This is an endpoint that processes a list of items concurrently and returns a server-sent event (SSE) stream as JSON
// The SSE stream is returned as a ReadableStream, which is supported by all modern browsers
// The client can then use new EventSource() to connect to the stream and receive updates as they are processed
// See https://developer.mozilla.org/en-US/docs/Web/API/EventSource for more information on EventSource
// See https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream for more information on ReadableStream
// This is helpful when you have a queue of items and you want to stream it to the frontend as it is processed


const sessions = new Set<{ id: string; body: any }>();

/**
 * Process items concurrently, updating the given ReadableStreamDefaultController
 * as each item is processed.
 *
 * @param {Array} items - The list of items to process.
 * @param {function} processItem - The function that processes an individual item. It should return a string or null.
 * @param {ReadableStreamDefaultController} controller - The ReadableStreamDefaultController to update as items are processed.
 * @param {number} [concurrency=5] - The maximum number of items to process concurrently.
 * @param {number} [heartbeatInterval=100] - The interval between sending heartbeat messages to the client (in milliseconds).
 * @returns {Promise<void>} A promise that resolves once all items have been processed.
 */
async function processConcurrently(
  items,
  processItem,
  controller,
  concurrency = 5,
  heartbeatInterval = 100
) {
  const queue = [...items];
  let activePromises = 0;

  const heartbeat = setInterval(() => {
    try {
      controller.enqueue(':\n\n');
    } catch (err) {
      console.log(err);
    }
  }, heartbeatInterval);

  return new Promise<void>((resolve, reject) => {
    const processNext = async () => {
      if (queue.length === 0 && activePromises === 0) {
        clearInterval(heartbeat);
        controller.enqueue('event: end-of-stream\n\n');
        resolve();
        return;
      }

      if (queue.length === 0 || activePromises >= concurrency) {
        return;
      }

      const item = queue.shift();
      activePromises++;

      try {
        const itemString = await processItem(item);
        if (itemString) {
          controller.enqueue(itemString);
          controller.enqueue('\n');
        }
      } catch (err) {
        reject(err);
      } finally {
        activePromises--;
        processNext();
      }
    };

    for (let i = 0; i < concurrency; i++) {
      processNext();
    }
  });
}

const processItem = async (item) => {
  // simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `data: ${item}\n`;
};

/**
 * Handle an incoming GET request and return a server-sent event (SSE) stream.
 *
 * @param {Object} req - The request object.
 * @param {URL} req.url - The request URL.
 * @returns {Promise<Response>} A promise that resolves to a Response object with the SSE stream.
 */
export const GET = async ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  // find the session with the given ID
  const session = [...sessions].find((s) => s.id === sessionId);
  if (!session) {
    throw error(404, 'Session not found');
  }
  
  let controller: ReadableStreamDefaultController<string>;

  return new Response(
    new ReadableStream({
      async start(_) {
        controller = _;
        await processConcurrently(session.body, processItem, controller);
        controller.close();
      },
      cancel: () => {
        sessions.delete(session);
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    }
  );
};


export const POST = async ({ url, request }) => {
  // Since SSE supports only GET method, we use POST first to give the server the request body, then return the session ID to the client. which will be used for the GET endpoint above.
  const sessionId = uuidv4()
  const body = await request.json()
  sessions.add({ id: sessionId, body })
  return json({ sessionId })
}