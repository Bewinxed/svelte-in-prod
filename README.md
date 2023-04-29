# Svelte-In-Prod 🧑‍🔬
A collection of snippets for using sveltekit for actual high-performance robust production apps.

# SvelteKit SSE Boilerplate

This boilerplate provides a reusable setup for Server-Sent Events (SSE) in SvelteKit applications. It consists of two main parts: the server endpoint (`+server.ts`) and the client-side code (`client.ts`).

## Server Endpoint (`+server.ts`)

The server endpoint is responsible for processing a list of items concurrently using a provided function and sending the results to the client as Server-Sent Events. The server implementation is based on SvelteKit's server-side API.

You can find the server code snippet in `+server.ts`.

## Client-side Code (`client.ts`)

The client-side code is responsible for handling the incoming SSE data and updating a writable Svelte store with the received data. The client implementation is compatible with both browser environments and SvelteKit's server-side rendering using the EventSourcePolyfill package.

You can find the client code snippet in `client.ts`.

## Usage

1. Include the provided `+server.ts` code snippet in your SvelteKit project by adding it to your desired API route.
2. Include the provided `client.ts` code snippet in your SvelteKit project.
3. Import and use the `streamData` function from `client.ts` in your Svelte components to stream data from the server.

For example, in a Svelte component:

```javascript
import { writable } from "svelte/store";
import { streamData } from "./client";

const dataStore = writable(new Map());

streamData("path/to/your/api/route", dataStore);
```

This will connect to the server endpoint and update dataStore with the incoming data from the server.

Remember to install the event-source-polyfill package if you want to use the boilerplate with SvelteKit's server-side rendering:
```javascript
npm install event-source-polyfill
```

## License
Ask me nicely :^)

Copyright (c) 2023 Bewinxed




