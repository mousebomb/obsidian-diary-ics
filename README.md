# Obsidian Diary ICS

[中文](README_zh.md) | English

This is an Obsidian plugin that synchronizes content from Obsidian's diary system to the system calendar application (such as macOS Calendar, Windows Calendar, etc.).

## Core Features

### Generate ICS Calendar Subscription File
- The plugin automatically generates an ICS format calendar subscription file (.ics) based on Obsidian's diary content
- The file will be hosted on a local HTTP port (e.g., `http://127.0.0.1:19347/feed.ics`) (you can also check the local network IP to use it for subscription on other devices in the same network)
- System calendar applications can subscribe to this link to synchronize Obsidian's diary content with the system calendar in real time

### Diary Content Parsing Rules
- The plugin parses Obsidian's diary note files (usually Markdown files named by date)
- Extracts primary or secondary level headings (configured by the user)
- Each extracted heading becomes a calendar entry corresponding to the date in the filename

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
```

If the user sets the plugin to extract all secondary level headings:

The plugin will extract two calendar entries:
- Event 1: Title "Morning Tasks", description includes "Plan with R&D", link to the diary
- Event 2: Title "Afternoon Tasks", description is empty, link to the diary

After subscribing to `http://127.0.0.1:99347/feed.ics` in the system calendar, you can see these two events.

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