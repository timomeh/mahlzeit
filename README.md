# Mahlzeit!

This is a web scraper. It scrapes websites of places in my neighborhood with
weekly lunch menus, and sends a Telegram message containing the menus a little
before my lunch time.

Needs an hourly cron which calls `/cron` with the `x-cron-secret` header.

## Getting Started

Copy `.env` to `.env.local` and fill in vars.

```bash
npm i
npm run dev # run server
npm run invoke # invoke cron
```