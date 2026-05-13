# Product Requirement Document (PRD) - AutoYTSummarizer (MVP)

## 1. Product Overview
**AutoYTSummarizer** is a web-based application that allows users to input a public YouTube playlist URL and instantly generate concise, AI-powered summaries for each video in the playlist. The app is designed to help users quickly extract key insights and determine which videos are worth watching without having to scrub through hours of content.

## 2. Target Audience
* Students and researchers looking to extract information from educational playlists.
* Professionals aiming to digest long-form tutorials, webinars, or conference talks efficiently.
* Content creators looking for inspiration or competitive analysis.

## 3. Core Features (MVP Scope)

### 3.1. Playlist Fetching
* Users can input a valid, public YouTube playlist URL.
* The system retrieves up to 50 videos from the playlist.
* For each video, the app displays the title, thumbnail, and publication date.
* Automatically filters out private or deleted videos.

### 3.2. AI-Powered Summarization
* **On-Demand Generation:** Users can trigger a summary generation for specific videos by clicking a "Generate Summary" button.
* **Two-Tiered Output:** 
  * A `shortSummary` (1-2 sentences) acts as a TL;DR on the video tile.
  * A `longSummary` (2-3 paragraphs) offers detailed takeaways.
* **Translation:** All summaries are explicitly translated and presented in English, regardless of the video's original spoken language.
* **Fallback Mechanism:** If a video lacks closed captions (transcripts), the AI infers a best-effort summary based solely on the video title to prevent application crashes.

### 3.3. User Interface & Experience
* **Bento Grid Layout:** A sleek, modern grid system (inspired by Linear.app) using a dark theme (`#121212`) with YouTube Red (`#FF0000`) highlights.
* **Modal Overlay:** The full, detailed summary is displayed in an elegant, animated modal overlay to keep the main interface clutter-free.
* **Date Sorting:** Users can sort the fetched playlist videos by "Newest First" or "Oldest First".
* **Loading States:** Skeleton loaders provide visual feedback during data fetching.
* **Rate Limit Handling:** Features a "Retry" mechanism for failed API requests and utilizes on-demand fetching to respect API quotas.

## 4. Success Metrics
* High success rate of summary generation (handling missing transcripts gracefully).
* Responsive UI with load times under 2 seconds for initial playlist fetching.
* A clean, visually striking aesthetic that looks premium on both desktop and mobile views.

---

## 5. Updates: AYTS-0002 (Dashboard, Pagination, & Workflow Polish)

### 5.1. Auto-Fetching Playlist Dashboard
* **Reason:** The previous flow required users to manually copy/paste YouTube URLs, creating friction.
* **Changes Made:** Replaced the URL input page with an automated Playlist Dashboard that connects to a predefined `YOUTUBE_CHANNEL_ID` and displays all public playlists dynamically.
* **User Experience Impact:** Massive improvement. Users can immediately see a visual grid of their content and browse with a single click, eliminating the need to leave the app to hunt for links.
* **Performance Impact:** Adds an initial API call on load, but significantly speeds up the overall user journey to value.

### 5.2. API Rate-Limit Workaround (Batch Summaries)
* **Reason:** Auto-fetching long summaries for a 45+ video playlist instantly exhausted the Gemini API's daily free tier quota (20 requests/day).
* **Changes Made:** Combined transcripts into a single mega-prompt (utilizing Gemini's 1M token context limit) to generate 1-sentence "short summaries" for all videos on the current page in **1 API request**.
* **User Experience Impact:** Users see a populated grid of "TL;DR" summaries instantly without worrying about blowing through limits.
* **Performance Impact:** Huge reduction in API call volume and backend concurrency load.

### 5.3. Page-Wise Architecture
* **Reason:** Fetching 100+ videos at once ("infinite scrolling") created massive transcript-fetching bottlenecks and risked token payload timeouts.
* **Changes Made:** Enforced strict pagination via the YouTube API. The app now fetches and displays exactly 18 videos per page, with clean "Next" and "Previous" controls.
* **User Experience Impact:** Creates a structured, manageable browsing experience and prevents the browser from lagging with massive DOM trees.
* **Performance Impact:** Dramatically reduces the data payload sent to Gemini, guaranteeing fast response times (< 5 seconds) and eliminating backend timeout errors.

### 5.4. Seamless 1-Click Modal Workflow
* **Reason:** It previously took two clicks (Generate -> Open Card) to read a summary, and background scrolling was visually distracting.
* **Changes Made:** Added tracking so the modal automatically springs open the exact millisecond a full summary finishes generating. Also added `overflow: hidden` to lock the background page.
* **User Experience Impact:** Creates a premium, "magic" feel. The user asks for data and it's handed directly to them in a focused, distraction-free overlay.
* **Performance Impact:** Neutral (purely a frontend DOM management optimization).

---

## 6. Updates: AYTS-0003 (Global Sorting & Rendering Optimization)

### 6.1. Hybrid Global Sorting
* **Reason:** Pagination effectively broke the "Newest First" feature, as it was only sorting the 18 videos present on the current page rather than the whole playlist.
* **Changes Made:** Separated data fetching from AI processing. The app now fetches the entire playlist from YouTube (which is extremely fast and cheap), sorts it globally on the frontend, and *then* slices it into pages of 18 before querying the AI for summaries.
* **User Experience Impact:** Sorting is now 100% chronologically accurate across the entire playlist.
* **Performance Impact:** No impact on AI quotas (still only batches 18 summaries at a time). Minor increase in initial YouTube data payload size.

### 6.2. Animated Image Loading States
* **Reason:** Network latency caused thumbnails to temporarily render as confusing, solid dark boxes before the images fully downloaded.
* **Changes Made:** Added a React `onLoad` state tracker to images, paired with a CSS-animated skeleton shimmer overlay that displays until the image successfully downloads.
* **User Experience Impact:** Provides immediate visual feedback that content is loading, drastically improving the perceived performance of the app.
* **Performance Impact:** Neutral.

### 6.3. Rendering & Deduplication Bug Fixes
* **Reason:** Users reported random "holes" in the CSS Grid where video cards simply failed to render or temporarily vanished during scrolling.
* **Changes Made:** 
    1. **Backend:** Deduplicated incoming YouTube data by `videoId` to prevent React rendering crashes caused by duplicate array keys.
    2. **Frontend (CSS):** Removed `backdrop-filter` from cards and added `transform: translateZ(0)` to bypass a notorious Chromium compositor bug that skips painting blurred layers during fast scrolling.
* **User Experience Impact:** The interface is now perfectly stable and robust; grid holes and flickering are entirely eliminated.
* **Performance Impact:** Noticeable improvement in scroll performance and lower GPU rendering overhead due to the removal of expensive real-time background blurring.
