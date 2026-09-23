# Movie World

Cinematic Next.js app for **movies and TV seasons** with playable embeds.

## Stack

- Next.js 16 + React 19 + Tailwind 4 + Framer Motion
- TMDB catalog
- Multi-server embed playback (VidSrc family)

## Run

```bash
cd movie-world
pnpm install
pnpm dev
```

→ http://localhost:3000

## Routes

| Path | Purpose |
|---|---|
| `/` | Hero + catalog rows |
| `/search` | Search / browse |
| `/movie/[id]` | Movie details + Play |
| `/tv/[id]` | Seasons / episodes + Play |
| `/watch/movie/[id]` | Movie player |
| `/watch/tv/[id]/[season]/[episode]` | Episode player |

## Servers

Watch pages include **ALPHA → ECHO** server chips. Switch if one embed fails.

## Env

```
TMDB_API_KEY=...
TMDB_READ_ACCESS_TOKEN=...   # optional
```

## Next ideas

- Watchlist / continue watching
- HLS extraction API (native player, like anime-world)
- Ads / auth / deploy
