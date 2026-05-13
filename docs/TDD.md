# Technical Design Document (TDD) - AutoYTSummarizer

## 1. Architecture Overview
AutoYTSummarizer utilizes a modern serverless architecture. The frontend is a Single Page Application (SPA) built with React and Vite, communicating with a backend powered by Firebase Cloud Functions. This architecture securely hides API keys from the client while providing scalable execution.

## 2. Technology Stack
*   **Frontend**: React.js (Vite), Vanilla CSS (Bento-box design system), Lucide-React (Icons).
*   **Backend**: Node.js 20, Firebase Cloud Functions (v2).
*   **External APIs**: 
    *   YouTube Data API v3 (Playlist fetching).
    *   Google Generative AI SDK / Gemini API (LLM Summarization).
    *   YouTube Transcript API (Caption scraping).

## 3. System Components

### 3.1. Frontend Application (`src/`)
*   **`App.jsx`**: The main controller. Manages state for `playlistVideos`, `summaries`, `sortOrder`, and orchestrates API calls to Firebase Functions.
*   **`components/PlaylistInput.jsx`**: Handles URL parsing, validation, and submission state.
*   **`components/SummaryCard.jsx`**: The presentation layer for individual videos. Implements the UI for the "Generate Summary" button, skeleton loaders, and the Modal Overlay for long summaries.
*   **`firebase.js`**: Initializes the Firebase SDK and connects to the Cloud Functions emulator during local development (`import.meta.env.DEV`).

### 3.2. Backend Cloud Functions (`functions/index.js`)
*   **`getPlaylistVideos`**: 
    *   An HTTPS Callable function.
    *   Extracts the playlist ID using Regex.
    *   Calls `youtube.playlistItems.list` to retrieve video metadata (`videoId`, `title`, `thumbnail`, `publishedAt`).
    *   Filters out "Private video" and "Deleted video" entries.
*   **`summarizeVideo`**: 
    *   An HTTPS Callable function (Timeout: 300s).
    *   *Step 1: Transcript Retrieval.* Uses `youtube-transcript` to scrape captions. If it fails, falls back to the video `title`.
    *   *Step 2: LLM Processing.* Calls `gemini-2.5-flash` using a strict prompt enforcing English and a specific JSON schema output (`shortSummary`, `longSummary`).
    *   *Step 3: Post-Processing.* Strips markdown code blocks from the LLM output to ensure safe `JSON.parse()` execution before returning the payload to the client.

## 4. Data Flow
1. User submits URL → `App.jsx` calls `getPlaylistVideos`.
2. Backend queries YouTube Data API → Returns formatted array of videos.
3. User clicks "Generate Summary" on a video tile → `App.jsx` calls `summarizeVideo(videoId, title)`.
4. Backend fetches transcript → Sends prompt to Gemini API → Returns parsed JSON.
5. Frontend updates state → Renders `shortSummary` and enables Modal for `longSummary`.

## 5. Security & Error Handling
*   **API Security**: `YOUTUBE_API_KEY` and `GEMINI_API_KEY` are stored safely in backend environment variables (`functions/.env`).
*   **Rate Limiting Mitigation**: To prevent exhausting the Gemini API free-tier limits (e.g., 20 requests/day), the application relies on manual, on-demand summary generation rather than aggressive batch processing.
*   **Graceful Degradation**: If transcripts are disabled by the video owner, the system seamlessly falls back to summarizing based on the video title.

---

## 6. Updates: AYTS-0002 (Architecture Refinements)

### 6.1. Backend Updates (`functions/index.js`)
*   **`getChannelPlaylists`**: Added to fetch playlists dynamically using `YOUTUBE_CHANNEL_ID`.
*   **`batchShortSummaries`**: Added a new function that takes an array of video IDs, securely fetches their transcripts, limits the transcript text to 250 words per video, and queries Gemini with a 1M token context window to generate a JSON map of `shortSummary` items in a single API call.
*   **`getPlaylistVideos`**: Refactored to drop the `do...while` infinite fetch. It now strictly respects `maxResults` (default 18) and returns Google API pagination tokens (`nextPageToken`, `prevPageToken`) directly to the client.

### 6.2. Frontend Updates (`src/App.jsx` & Components)
*   **Pagination State**: Added `nextPageToken`, `prevPageToken`, and `currentPage` states. "Next" and "Previous" button `onClick` handlers pass these tokens back to the `getPlaylistVideos` function to load precise data chunks.
*   **Modal Event Hooks**: `SummaryCard.jsx` utilizes `useEffect` hooks tracking `status` ref-transitions to programmatically flip `isModalOpen` to true when a long summary promise resolves. Added a side-effect hook on `document.body` to manipulate overflow properties.

---

## 7. Updates: AYTS-0003 (Global Sorting & Rendering Optimization)

### 7.1. Backend Updates (`functions/index.js`)
*   **Deduplication Layer**: `getPlaylistVideos` now employs a `Set` to filter out videos with duplicate `videoId` strings, guaranteeing 100% unique React keys for the frontend rendering engine.
*   **Data Fetching**: Restored the `do...while` loop in `getPlaylistVideos` to fetch the entire playlist content (safeguarded at ~500 items max) rather than paginating at the API level, enabling global client-side sorting.

### 7.2. Frontend Updates (`src/App.jsx` & Components)
*   **Array Slicing Architecture**: `App.jsx` now stores `allPlaylistVideos` in state, sorts it globally via a `useMemo` hook, and mathematically slices the sorted array into 18-item chunks based on `currentPage`. The `batchShortSummaries` function fires dynamically using a `useEffect` hook whenever a new, unsummarized chunk is rendered.
*   **Image Loading State**: `SummaryCard.jsx` now tracks an `imageLoaded` boolean, rendering a CSS-based absolute-positioned skeleton loader that gracefully fades out (`opacity` transition) upon the native `onLoad` image event.
*   **CSS GPU Acceleration**: Stripped `backdrop-filter` from `.bento-card` and added `transform: translateZ(0)` to force the browser to elevate the cards to dedicated GPU compositor layers. This resolves a known Chromium bug where scrolling repaints drop blurred layers from the view tree.
