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
