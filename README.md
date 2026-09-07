# Wander, Together

An ambient travel memory collection for two, with Texas as home and 17 visited destinations ready for stories.

## Run locally

Use Node 22.13 or later. Run `npm ci` then `npm run dev`. Open the address printed by the server. `npm run build` creates the production bundle; `npx tsc --noEmit` checks types. Run the backup validation tests with `node --experimental-strip-types --test tests/memories.test.mjs`.

## Add memories

Choose a destination and select **Add a memory**. Add a title, trip/place, optional date, story and author. Upload up to 30 JPG/PNG/WebP photos per memory, caption each photo, and choose the cover. HEIC should be exported as JPG before uploading. Each file can be up to 15 MB.

Record a voice note after granting microphone permission or attach MP3/M4A/WAV/OGG/WebM audio. Recording requires a secure context (HTTPS or localhost); ordinary LAN HTTP can preview photos but does not grant microphone access. Audio starts only when you press play. Ambient sound is an optional synthesized tone, off by default.

Browse by destination, year, search or favorites. Open a memory for photos, captions, the story and audio. The viewer supports arrow keys and an optional five-second slideshow. Editing and confirmed deletion are available on each memory.

## Storage and backups

This release is explicitly **local-first**. Memory content (including photographs and recordings) is stored in IndexedDB on the current browser and origin, outside the source code. Reloading retains it, but clearing site data removes it. Chrome and another browser have separate collections. Changing hostnames or ports also creates a separate collection.

Export a JSON backup regularly. It includes photos and audio. Restore imports new memory IDs and leaves existing memories unchanged; it does not merge edits to the same memory. Keep backups private. Backups up to 250 MB can be restored in the interface. Large collections should be kept in smaller browser collections until shared server storage is connected.

Shared cloud storage, accounts and automatic synchronization between devices are **not connected**. Publishing the source to GitHub does not publish or synchronize the memories. No personal uploads are written to the public repository.

## Ready destinations

Texas (home), Florida, Tennessee, Illinois, New York, New Jersey, Colorado, Arizona (Phoenix), Nevada, California, Hawaii, Georgia, Michigan, Oklahoma, Dubai, Maldives and Bahamas. Other US states remain available for future trips.
