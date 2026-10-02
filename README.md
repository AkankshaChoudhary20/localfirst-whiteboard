# Local-first Whiteboard

An offline-capable collaborative canvas with sticky notes, rectangles, circles, live cursors, keyboard object editing, undo/redo, PNG export, and persistent room snapshots. Uses Yjs, IndexedDB, a service worker, and a local WebSocket server.

## Run

Requires Node.js 22+.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:1234/?room=studio. Open the same room in another browser to collaborate. Use the tool selector to add objects, drag to move, or select an object from the accessible list and use arrow buttons to move it. Notes have a separate text editor. Use **Work offline** to disconnect syncing, edit, and reconnect to merge changes.

For development, run `npm run server` in one terminal and `npm run dev` in another. Vite proxies WebSocket requests to port 1234. Offline reload caching is enabled only in the production build.

## Persistence and merging

A Yjs map contains nested maps for individual shapes. Text and position properties can merge independently. Local edits are saved in IndexedDB; remote updates are persisted locally too. Reconnecting exchanges full Yjs updates with the server. Server snapshots live in `data/rooms` (override with `BOARD_DB`); set `PORT` to change port 1234. A service worker caches the production app after the first visit, allowing later offline reloads after installation completes. Browser storage clearing removes local changes not synced to the server.

Offline availability requires a successful initial load, browser storage, and localhost or HTTPS. Keep the tab open while testing the offline toggle. For collaboration between machines, run behind an authenticated reverse proxy and expose the local service deliberately; the default binds to loopback.

## Validation

```sh
npm test
npm run build
```

Four tests passed: offline insertions converge, concurrent text/position edits merge, deletion wins over concurrent edits, and room snapshots survive restart. Production bundling passed. Interactive browser testing, IndexedDB persistence, cursor networking, and service-worker installation were not exercised in the managed macOS sandbox.

## Scope

This MVP uses plain JavaScript and Canvas. The Yjs transport and IndexedDB adapter are implemented locally, keeping the protocol small. It uses full-document updates rather than incremental state-vector negotiation. Cursor presence is transient. Rooms have no authentication; server memory and storage are not quota-managed. Avoid public deployment without access controls, quotas, and isolated storage. The canvas has a fixed logical size of 1600 × 1000 and an object list for keyboard editing; screen-reader collaboration needs further work.

MIT licensed.
