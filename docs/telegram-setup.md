# Telegram setup

## Required server env

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `TELEGRAM_QUOTE_CHAT_ID`

## Supabase sync

- Store secret tokens in Vault or server env.
- Keep only non-sensitive routing/config data in public Supabase tables.
- Use `SUPABASE_CONNECTION_STRING` for the sync script and any server-side persistence helpers.

## Local test

- Run the app on port `3100`.
- Send one chat message and one quote request.
- Confirm the API responds without exposing tokens in the client.
