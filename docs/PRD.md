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
