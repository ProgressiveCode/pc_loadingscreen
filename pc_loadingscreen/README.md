# Loading Screen — Progressive Code

A standalone RedM loading screen with a cinematic frontier landscape, personal connection ticket, real loading progress, configurable information panels and a selectable soundtrack playlist. The resource uses plain Lua, HTML, CSS and JavaScript. No framework, database, CDN, package manager or build step is required.

## Installation

1. Disable or remove any other loading-screen resource from `server.cfg`. Only one loading screen should be active.
2. Copy the `pc_loadingscreen` folder into your RedM resources directory.
3. Add `ensure pc_loadingscreen` to `server.cfg`.
4. Edit `Shared/Main.lua` and `Html/Js/Config.js` for your server.
5. Restart the resource and reconnect to test the complete join and spawn flow.

## Configuration files

The configuration is intentionally split by responsibility:

| File | What it controls |
| --- | --- |
| `Shared/Main.lua` | Automatic/manual shutdown, fade duration, safety timeout and connection handover data |
| `Html/Js/Config.js` | Server branding, text, accent color, image/video, music playlist, links, chapters, rules, guide and staff panels |
| `Html/Css/Style.css` | Layout, colors, typography, animations and responsive design |
| `Html/Index.html` | Page structure and accessible UI controls |
| `Html/Js/App.js` | UI behavior, panels, loading progress, motion preferences and cleanup |
| `Html/Js/Audio.js` | Playlist selection, play/pause, volume and saved music preferences |

Edit the existing configuration files directly. No build process or compiled files are used.

## Music playlist

Three original soundtracks are included and ready to use:

| Track ID | Display title | File |
| --- | --- | --- |
| `western_theme_luis_humanoide` | Western Theme | `Html/Sounds/western_theme_luis_humanoide.mp3` |
| `western_ride_sonican` | Western Ride | `Html/Sounds/western_ride_sonican.mp3` |
| `country_music_maksym_malko` | Country Music | `Html/Sounds/country_music_maksym_malko.mp3` |

Players can select a song from the dropdown, move to the previous/next track, play or pause music and adjust the volume. The last selected track and volume can be remembered locally when storage is available. The selected soundtrack loops by default.

### Add another song

1. Put the audio file inside `Html/Sounds/`.
2. Open `Html/Js/Config.js` and locate `music.tracks`.
3. Copy one track entry, then update its `id`, `title`, `artist` and `src` values.

Example:

```javascript
{
    id: 'my-new-track',
    title: 'My New Soundtrack',
    artist: 'My Server · Background music',
    src: 'Sounds/my-new-track.ogg',
},
```

Use a unique ID for every song. The path is relative to the `Html/` folder. Common Chromium-supported formats such as OGG, MP3 and WAV can be used. Keep files reasonably small and prefer local assets over remote streaming links.

To make a song the default selection, set `music.selectedTrack` to its ID. To disable music completely, set `music.enabled = false`. Autoplay is off by default because some Chromium/CEF builds require a user interaction before audio can start.

## Visual configuration

In `Html/Js/Config.js` you can edit:

- `brand`: server initials, name, subtitle, destination and optional logo.
- `accent`: the main six-digit HEX accent color.
- `headline` and `introduction`: the main welcome message.
- `background`: local image, optional local video and default motion preference.
- `slides`: the rotating story chapters and their text.
- `guide`, `rules` and `staff`: the information panels. Their navigation buttons hide automatically when the corresponding array is empty.
- `links`: community URLs. Empty or non-HTTPS links are ignored.
- `text`: loading messages and interface labels.
- `rotateSeconds`: chapter rotation interval. Set it to `0` to turn off automatic rotation.

The starter text is only example copy. Replace it with your own server information before release.

## Lua lifecycle configuration

Open `Shared/Main.lua`:

```lua
Progressive_Code_Loading_Screen_Config.Lifecycle = {
    AutoClose = true,

    FadeMs = 900,

    ReadyDelayMs = 1000,

    MaxRuntimeHoldMs = 120000,
    
    CloseOnPlayerSpawned = true,
}
```

- `AutoClose = true`: closes after the network session starts and the configured delay passes.
- `FadeMs`: UI fade duration, limited to 3000 ms.
- `ReadyDelayMs`: extra delay after `NetworkIsSessionStarted()` becomes true.
- `MaxRuntimeHoldMs`: safety timeout measured from the client script starting. Set it to `0` to disable it. It is not a resource-download deadline.
- `CloseOnPlayerSpawned`: enables the additional `playerSpawned` close signal while automatic mode is enabled.

### Manual shutdown for custom character selectors

When a character creator or custom spawn flow must control the exact shutdown moment, configure:

```lua
Progressive_Code_Loading_Screen_Config.Lifecycle.AutoClose = false
Progressive_Code_Loading_Screen_Config.Lifecycle.MaxRuntimeHoldMs = 0 -- Optional: disable the safety timeout.
```

Then call the client export from your character/spawn resource when the player is ready:

```lua
exports.pc_loadingscreen:Close()
```

You can also use the local client event:

```lua
TriggerEvent('pc_loadingscreen:close')
```

Update the status before closing:

```lua
exports.pc_loadingscreen:SetStatus('Preparing your character...')
```

A local `pc_loadingscreen:closed` event is emitted after native shutdown. The `Close` export is idempotent; repeated calls do not start additional shutdown sequences.

### Connection handover metadata

`Progressive_Code_Loading_Screen_Config.Handover` controls the optional connection-time player name and population snapshot:

```lua
Progressive_Code_Loading_Screen_Config.Handover = {
    Enabled = true,

    SendPlayerName = true,

    SendPopulation = true,
}
```

Population is a connection-time snapshot, not a live count. Disable `Enabled` to turn handover metadata off. If another connection resource also sets handover data, merge the `pc_loading` table there or disable this resource's handover feature.

## Included assets

- `Html/Images/Background.png`: original cinematic frontier background.
- `Html/Images/WesternCursor.png`: custom western-style cursor used only inside the loading screen.
- `Html/Sounds/western_theme_luis_humanoide.mp3`: original ambient soundtrack.
- `Html/Sounds/western_ride_sonican.mp3`: original ambient soundtrack.
- `Html/Sounds/country_music_maksym_malko.mp3`: original ambient soundtrack.

The two additional soundtracks were procedurally synthesized for this resource. No commercial music samples are bundled.

To use your own background image, place it in `Html/Images/` and update `background.image`. For video, use a short CEF-compatible file such as WebM and set `background.video`; keep the image configured as a fallback. Avoid large video files because they can delay the initial display.

## Performance and implementation notes

- Standalone RedM resource; no framework or database calls.
- No external CDN, analytics, tracking script or runtime package dependency.
- Loading progress uses the Cfx `loadProgress` / `loadFraction` message. No fake gameplay progress is generated.
- Browser preview simulation is only enabled with `Html/Index.html?preview=1` and is visibly labelled.
- Music is not preloaded as a full download; the audio element uses `preload="none"`.
- The UI uses one low-frequency one-second timer for elapsed time and optional chapter rotation.
- The Lua automatic-close check uses a short-lived 250 ms thread which exits once closing starts.
- Audio, video and UI timers are stopped during shutdown and page cleanup.
- Local assets are recommended to avoid remote dependencies.

## Validation and compatibility

The resource has been checked for JavaScript syntax, Lua source structure, manifest paths, playlist asset references and ZIP integrity. A browser preview can be opened locally with `Html/Index.html?preview=1`.

A live RedM server test is still required to verify the exact connection, resource download, character-selection and shutdown behavior in your server's current environment. Different character creators and other resources may have their own loading-screen or handover behavior; test those integrations before public release.

Copyright © 2026 Progressive Code.
All Rights Reserved.

This resource is protected by copyright.
Unauthorized redistribution, resale or claiming ownership
of this resource is strictly prohibited.

See LICENSE.txt for the full license terms.