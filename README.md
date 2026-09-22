# Diary ICS

[中文](README_zh.md) | English

This is an Obsidian plugin that synchronizes content from Obsidian's diary system to the system calendar application (such as macOS Calendar, Windows Calendar, etc.).


https://github.com/user-attachments/assets/5cca303c-9c91-4805-ad37-8213e5124f62


## Core Features

### Generate ICS Calendar Subscription File
- The plugin automatically generates an ICS format calendar subscription file (.ics) based on Obsidian's diary content
- The file will be hosted on a local HTTP port (e.g., `http://127.0.0.1:19347/feed.ics`) (you can also check the local network IP to use it for subscription on other devices in the same network)
- System calendar applications can subscribe to this link to synchronize Obsidian's diary content with the system calendar in real time

### Diary Content Parsing Rules
- The plugin parses Obsidian's diary note files (usually Markdown files named by date)
- Extracts primary or secondary level headings (configured by the user)
- Each extracted heading becomes a calendar entry corresponding to the date in the filename
- If the heading contains time (HH:mm), it will be parsed and used as the event start time. If no time is found, the event will be considered as an all-day event.

### Calendar Entry Details
Each calendar entry (event) will contain:
- **Title**: Primary or secondary level heading extracted from the diary file
- **Link (URL)**: A clickable link 
  - Format: `obsidian://open?vault=YourVaultName&file=DiaryFilePath`
  - Clicking it directly jumps back to the corresponding diary file in Obsidian
- **Description**:
  - Contains all subheadings under the extracted heading

### Frontmatter
If the diary has frontmatter fields, the plugin concatenates the day's frontmatter into a text output as an additional event.
By default, each property is displayed on a separate line as the event description.
Custom rules can be edited, for example: `weather:{{weather}} mood:{{mood}}` to extract weather and mood properties from frontmatter.
If you don't know frontmatter, you can refer to the [official documentation](https://help.obsidian.md/Properties) for more information.


### Time Parsing Rules
- If the heading contains time (HH:mm) or time range (HH:mm~HH:mm), it will be parsed and used as the event start time.
- If no time is found, the event will be considered as an all-day event.

Examples of titles that can be parsed:
- `## 10:00~12:00 Team Meeting` will be parsed as a meeting from 10:00 to 12:00
- `## Team Meeting 10:00` will be parsed as a meeting from 10:00 to 11:00 (default end time is 1 hour after start time, user can set default duration in plugin settings)
- `## Outdoor Walk` will be parsed as an all-day event


## Example Explanation

Assume you have a diary file: `2025-05-14.md` with the following content:

```markdown
# Today's Work Summary

## Morning Tasks
- Complete Module 1 of Project A

### Plan with R&D
- Complete Module B
- Contact Client

## Afternoon Tasks
- Meet with team to discuss requirements

## Evening Tasks 19:00
- Dinner with friends

```

If the user sets the plugin to extract all secondary level headings:

The plugin will extract 3 calendar entries:
- Event 1: Title "Morning Tasks", description includes "Plan with R&D", link to the diary
- Event 2: Title "Afternoon Tasks", description is empty, link to the diary
- Event 3: Title "Evening Tasks", description is empty, link to the diary, time is 19:00-20:00

After subscribing to `http://127.0.0.1:99347/feed.ics` in the system calendar, you can see these three events.

## Usage Instructions

1. Install and enable this plugin in Obsidian
2. Configure in plugin settings:
   - Heading level to extract (primary or secondary)
   - HTTP server port (default 19347)
3. Copy the ICS subscription link provided by the plugin
4. Add this subscription link in your system calendar application
5. Now your Obsidian diary content will be automatically synchronized to the system calendar

## Development Information

- This plugin is developed using TypeScript
- Starts a local HTTP server to provide ICS files
- Generates calendar files according to the ICS standard
