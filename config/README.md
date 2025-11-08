# Game Configuration Files

This folder contains all the game data for the website. Each game is stored as a separate JSON file.

## File Structure

```
config/
├── index.json          # Master list of all game files
├── game1.json          # Individual game data
├── game2.json          # Individual game data
├── game3.json          # Individual game data
├── ...
└── game_template.json  # Template for adding new games
```

## How to Add a New Game

### Method 1: Copy Template (Recommended)

1. **Copy the template:**
   ```bash
   cp config/game_template.json config/game7.json
   ```

2. **Edit your new file** (`config/game7.json`):
   - Change the `id` to a unique number (7, 8, 9, etc.)
   - Update the `title` with your game name
   - Fill in the `description`
   - Add image URLs (use Roblox CDN or any image host)
   - Add YouTube video URL if you have one
   - Set the `price` (0 for free)
   - Add your download link (Linkvertise or direct)
   - Update dates to today's date
   - Add FAQ items if needed

3. **Register the file in index.json:**
   ```json
   {
       "games": [
           "game1.json",
           "game2.json",
           "game3.json",
           "game4.json",
           "game5.json",
           "game6.json",
           "game7.json"
       ]
   }
   ```

4. **Refresh the website** - Your game will appear automatically!

### Method 2: Create From Scratch

Create a new file `config/gameX.json` with this structure:

```json
{
    "id": X,
    "title": "Your Game Name",
    "description": "Game description",
    "image": "https://url-to-main-image.png",
    "images": [
        "https://url-to-screenshot1.png",
        "https://url-to-screenshot2.png"
    ],
    "video": "https://www.youtube.com/embed/VIDEO_ID",
    "price": 0,
    "download_link": "https://your-download-link.com",
    "date_added": "2025-11-08",
    "last_updated": "2025-11-08",
    "downloads": 0,
    "faq": []
}
```

Then add the filename to `index.json`.

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Unique identifier for the game |
| `title` | string | ✅ | Game name (shown on cards and modal) |
| `description` | string | ✅ | Detailed description of the game |
| `image` | string | ✅ | URL to main thumbnail image |
| `images` | array | ❌ | Array of screenshot URLs for gallery |
| `video` | string | ❌ | YouTube embed URL (not watch URL) |
| `price` | number | ✅ | Price in dollars (0 for free) |
| `download_link` | string | ✅ | Linkvertise or direct download URL |
| `date_added` | string | ✅ | Date added (YYYY-MM-DD format) |
| `last_updated` | string | ✅ | Last update date (YYYY-MM-DD format) |
| `downloads` | number | ✅ | Download count (for sorting) |
| `faq` | array | ❌ | Array of question/answer objects |

## Image URLs

You can use:
- Roblox CDN: `https://tr.rbxcdn.com/...`
- Imgur: `https://i.imgur.com/...`
- Any image hosting service

**Tip:** For Roblox game thumbnails, right-click on a game thumbnail on Roblox.com and copy the image address.

## Video URLs

Use YouTube **embed** URLs, not watch URLs:
- ✅ Correct: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- ❌ Wrong: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

To get the embed URL:
1. Go to your video on YouTube
2. Click "Share" → "Embed"
3. Copy the URL from the `src="..."` attribute

## FAQ Format

```json
"faq": [
    {
        "question": "Is this the full game?",
        "answer": "Yes, this includes all features from the original game."
    },
    {
        "question": "Can I monetize this?",
        "answer": "Yes, you can add your own monetization."
    }
]
```

## Editing Existing Games

Simply edit the corresponding `gameX.json` file and save. The changes will appear when you refresh the website.

## Deleting Games

1. Delete the game file (e.g., `game3.json`)
2. Remove the filename from `index.json`
3. Refresh the website

## Tips

- **Use sequential IDs:** Keep IDs in order (1, 2, 3, 4...)
- **Update dates:** Change `last_updated` when you modify a game
- **Test locally:** Always test changes on localhost before deploying
- **Backup:** Keep backups of your game files before making major changes
- **Validate JSON:** Use a JSON validator if you get errors

## Troubleshooting

**Games not showing up?**
- Check that the filename is listed in `index.json`
- Validate your JSON syntax (use jsonlint.com)
- Check browser console for errors
- Make sure all required fields are filled

**Images not loading?**
- Verify the image URLs work in a browser
- Check that URLs use HTTPS (not HTTP)
- Make sure images are publicly accessible

**Video not showing?**
- Use YouTube embed URLs (not watch URLs)
- Make sure the video is not private/unlisted
- Check that the URL format is correct

## Example: Adding "Tower Defense Kit"

1. Create `config/game7.json`:
```json
{
    "id": 7,
    "title": "Tower Defense Kit",
    "description": "Complete tower defense game with enemy AI and tower placement.",
    "image": "https://tr.rbxcdn.com/example.png",
    "images": ["https://tr.rbxcdn.com/example.png"],
    "price": 0,
    "download_link": "https://linkvertise.com/example",
    "date_added": "2025-11-08",
    "last_updated": "2025-11-08",
    "downloads": 0,
    "faq": []
}
```

2. Update `config/index.json`:
```json
{
    "games": [
        "game1.json",
        "game2.json",
        "game3.json",
        "game4.json",
        "game5.json",
        "game6.json",
        "game7.json"
    ]
}
```

3. Done! Refresh and see your new game.

---

Need help? Join our Discord: [discord.gg/JcqDxZGUcf](https://discord.gg/JcqDxZGUcf)
