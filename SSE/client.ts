import { Writable } from "svelte/store";
import EventSourcePolyfill from 'eventsource';
import { browser } from '$app/environment';

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

// IMPORTANT FOR NODE/NGINX USERS, SET THE FOLLOWING IN YOUR NGINX CONFIG TO AVOID 502/504/HTTP2 ERRORS:
// location / {

//     proxy_buffer_size   128k;
//     proxy_buffers   4 256k;
//     proxy_busy_buffers_size   256k;
   
   
//     # Proxy!
//          include conf.d/include/proxy.conf;
//     }


/**
 * Stream data from an event source and update a writable store with the received data.
 * 
 * @param {string} eventSourceUrl - The URL of the event source to connect to.
 * @param {Writable<Map<string, T>>} store - The writable store to update with received data.
 * @param {function} [parseData=JSON.parse] - The function to parse the incoming data (optional).
 * @template T - The type of data stored in the Map.
 * @returns {void}
 */
export async function streamData<T>(
    eventSourceUrl: string,
    store: Writable<Map<string, T>>,
    parseData: (data: string) => T & { key: string } = JSON.parse
  ) {
    const eventSource = browser
      ? new EventSource(eventSourceUrl)
      : new EventSourcePolyfill(eventSourceUrl);
  
    eventSource.onmessage = (event) => {
      const parsedData = parseData(event.data);
      store.update((currentData) => currentData.set(parsedData.key, parsedData));
    };
  
    eventSource.addEventListener("end-of-stream", () => {
      console.log("End of stream received, closing connection...");
      eventSource.close();
    });
  
    eventSource.onerror = (event) => {
      const closed = browser ? EventSource.CLOSED : EventSourcePolyfill.CLOSED;
      if (event.eventPhase === closed) {
        console.log("Connection was closed!");
        eventSource.close();
      }
    };
  }