# Wander, Together

An ambient travel memory collection for two, with Texas as home and 17 visited destinations ready for stories.

## What you need

- **Node.js 22.13 or later** (Node 22 recommended), with npm included.
- **Git**, to download the project and contribute changes.
- A modern browser with WebGL support for the 3D scene.
- Internet access for installation and the first font download.

Check your installation in Terminal (macOS/Linux) or PowerShell (Windows):

```sh
node --version
npm --version
git --version
```

No API keys, database setup, paid accounts or `.env` file are required for this local version.

## One-command quick start

From the parent folder where you want the project, paste this into **macOS/Linux Terminal, Git Bash, or PowerShell 7+**:

```sh
git clone https://github.com/justinmail735-eng/our-living-atlas.git && cd our-living-atlas && npm run setup
```

This downloads the code, installs the exact dependencies in the lockfile, and starts the local website. It requires the tools above to be installed first and creates a new `our-living-atlas` folder. If that folder already exists, use the existing-project instructions below.

Open **http://localhost:3000/** in your browser, or use the Local address printed in the terminal if it differs. Keep that terminal open while using the site. Press **Ctrl+C** to stop the server.

Windows PowerShell 5 users should run these commands on separate lines, stopping if any command fails:

```powershell
git clone https://github.com/justinmail735-eng/our-living-atlas.git
cd our-living-atlas
npm run setup
```

## Already downloaded the project?

Inside the project folder, install and launch with:

```sh
npm run setup
```

On later visits, dependencies are already installed, so just run:

```sh
npm run dev
```

`npm run setup` reinstalls dependencies using `npm ci`; it does not erase browser memories. Running `npm run dev` alone is faster for everyday use.

## Useful commands

Run these from the project folder:

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install locked dependencies and start the local website. |
| `npm run dev` | Start development; saved code changes refresh automatically. |
| `npm run dev:network` | Make the preview accessible to devices on the same network. |
| `npm run dev -- --port 3001` | Start on another port if 3000 is busy. |
| `npm test` | Run backup validation and destination tests. |
| `npm run typecheck` | Check TypeScript. |
| `npm run build` | Build the production bundle. |
| `npm run check` | Run tests, type checks and the production build. |
| `npm run lint` | Run the code linter. |
| `npm run format` | Format source files; this changes files. |
| `npm start` | Preview the built Cloudflare Worker locally; run the build first. |

`npm start` uses Wrangler and prints its own local address, which may differ from the development server. It does **not** publish the website online.

## Open on a phone or another computer

Stop the current server with Ctrl+C, then run:

```sh
npm run dev:network
```

Connect both devices to the same trusted Wi-Fi network, and open the printed **Network** address on the other device, for example `http://192.168.1.20:3000`. Use your actual printed address. Allow incoming connections if your computer's firewall asks. Keep the hosting computer awake.

`localhost` on a phone points to the phone, not your computer. The network preview is reachable by other devices on that network and should not be exposed to the public internet. Microphone recording requires HTTPS or localhost, so use the computer's localhost address to record, or attach an existing audio file on the phone.

## Get the latest version

Stop the server, commit or stash your own code changes, then run from the project folder:

```sh
git pull --ff-only origin master
npm run setup
```

If Git reports conflicts or says the branches have diverged, resolve those changes before continuing. Do not discard someone else's work to update.

## Contribute changes

Collaborators with write access can create a branch, edit, check and push:

```sh
git switch -c my-memory-improvements
# Edit the files, then verify:
npm run check
git add app lib README.md
git commit -m "Improve our memory site"
git push -u origin my-memory-improvements
```

Adjust the `git add` paths to include the files you actually changed, then open a pull request to `master` on GitHub. Without write access, fork the public repository to your own account first and clone your fork. Public visibility allows pull requests; it does not give everyone permission to push directly.

Main files: `app/page.tsx` contains the memory interface, `app/memories.css` styles it, `app/AtlasScene.tsx` renders the 3D scene, and `lib/memories.ts` manages destinations, browser storage and backup validation.

## Troubleshooting

- **`node`, `npm` or `git` not found:** install the missing tool and reopen your terminal.
- **Unsupported Node version:** switch to Node 22.13 or newer and rerun `npm run setup`.
- **Folder already exists:** open that folder and use `npm run setup`; do not clone over it.
- **Port already in use:** stop the earlier server with Ctrl+C, or use the alternative-port command above.
- **Cannot open the page:** check that the server is still running and copy its printed Local or Network address, including `http://` and the port.
- **Installation/font download fails:** check your internet connection or proxy, then retry. The first run needs to download dependencies and fonts.
- **Microphone is unavailable:** use localhost or HTTPS, allow browser microphone permission, or attach an audio file.
- **HEIC photo is rejected:** export it as JPG first. Supported images are JPG, PNG and WebP.
- **Memories seem missing:** use the same browser, hostname and port where you saved them, or restore a backup. Localhost and a LAN address have separate storage.
- **Saving fails:** export a backup before clearing site data or freeing browser storage.

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
