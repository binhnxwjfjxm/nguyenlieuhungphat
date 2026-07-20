# Hung Phat integration sync

This repository keeps Telegram and Google secrets out of public tables.

## Stored in Supabase

- `public.hung_phat_chat_sessions`
- `public.hung_phat_chat_messages`
- `public.hung_phat_quote_leads`
- `public.hung_phat_playbooks`
- `public.hung_phat_integration_settings`
- Vault secret `hung_phat_telegram_bot_token`
- Vault secret `hung_phat_google_service_account_json`

## Local inputs

- `.env.local`
- `Project-ID-dialog-supprot-vlgn.json`
- `SUPABASE_CONNECTION_STRING`

## Sync command

```bash
npm run sync:integrations
```

## Notes

- Secrets are written to Vault, not to public tables.
- Telegram runtime uses `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, and `TELEGRAM_QUOTE_CHAT_ID`.
- The script does not print secret values.
