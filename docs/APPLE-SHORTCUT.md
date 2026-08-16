# Apple Shortcut recipe

Create a Shortcut named **Vox** and assign it to the iPhone Action Button.

1. Add **Text** containing your deployed base URL, for example `https://vox.example`.
2. Add **Speak Text**: “Hello, what are we doing today?”
3. Add **Record Audio** with Start Recording set to **Immediately**, Finish Recording set to **After Time**, and duration initially set to **10 seconds**.
4. Add **Get Contents of URL**:
   - URL: `[base URL]/api/voice/turn`
   - Method: `POST`
   - Request Body: `Form`
   - Field `audio`: the Recorded Audio variable (File)
5. Add **Get Dictionary Value** for `speak` from the response, then **Speak Text** using that value.
6. Save `conversationId` from the response in a Shortcut variable named `Conversation ID`.
7. Read `requiresResponse`. If true, repeat Record Audio and POST with both `audio` and `conversationId` form fields.
8. Stop the loop when `requiresResponse` is false, state is `COMPLETED`, `CANCELLED`, or `FAILED`, or a practical turn/timeout limit is reached.

For a wallet-aware Shortcut, add the public smart-account address as form field `walletAddress`. Never put a private key or API key in the Shortcut.

The recording duration is a Shortcut setting, not a permanent backend limit. Vox accepts WebM, MP4/M4A, MPEG/MP3, WAV, AAC, and OGG audio up to 12 MB. iOS may label an M4A recording as `audio/x-m4a`, which is accepted.
