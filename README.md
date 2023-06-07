# Mahlzeit!

aka Wurstwecker

This is a web scraper. It scrapes the websites of places in my neighborhood that
have lunch menus and sends me a daily summary of all the menus today.

Needs an hourly cron which calls `/cron` with the `x-cron-secret` header.

## Features

- Parses menus into nice plaintext
- Sends a notification via Telegram
- Connects to my Google Calendar and only sends me a notification when I'm
  working in my homeoffice today

## Getting Started

Copy `.env` to `.env.local` and fill in vars.

```bash
npm i
npm run googleauth # auth to google
npm run dev # run server
npm run invoke # invoke cron
```

### Auth to Google

Run `npm run googleauth` locally. Follow the instructions. It stores a
refresh_token which is used by the server.
