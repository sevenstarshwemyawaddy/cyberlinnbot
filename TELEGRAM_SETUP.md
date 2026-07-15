# Telegram Bots & Channels Setup Guide

## 1. Setting Up Bots

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Type `/newbot` to create a new bot.
3. Assign a display name and username.
4. Copy the generated **HTTP API Token** (looks like `123456789:ABC...`).
5. Open the **Storage & Targets** tab in the Admin dashboard and paste the token under the "Register Bot" form.

---

## 2. Channels and Groups setup

### A. Telegram Channel Setup
1. Create a public or private Channel.
2. Go to **Channel Settings** -> **Administrators** -> **Add Administrator**.
3. Search for your bot username and add it. Give the bot permissions to **Post Messages**.
4. Register the channel username (e.g., `@saas_automation`) inside the **Storage & Targets** panel.

### B. Telegram Group Setup
1. Create a Group.
2. Add your bot to the group.
3. Turn on administrator rights for the bot so it can upload media documents.
4. Obtain the group ID (use a bot like `@raw_infobot` to retrieve the numeric group ID starting with `-100`).
5. Save the group ID into the targets config list.
