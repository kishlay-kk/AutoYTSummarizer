# Dependency Document - AutoYTSummarizer

This document outlines the core dependencies utilized across the frontend and backend of the application.

## 1. Frontend Dependencies (`package.json`)

### Core Libraries
*   **`react` (^18.2.0)** & **`react-dom` (^18.2.0)**: The core UI library.
*   **`firebase` (^10.11.0)**: The Firebase Web SDK. Used specifically for `firebase/app` and `firebase/functions` to invoke backend endpoints securely.
*   **`lucide-react` (^0.372.0)**: A clean, customizable SVG icon library used for UI elements (e.g., `PlayCircle`, `Calendar`, `X` for closing modals).

### Build Tools & Dev Dependencies
*   **`vite` (^5.2.0)**: Fast, modern frontend build tool and development server.
*   **`@vitejs/plugin-react` (^4.2.1)**: React plugin for Vite.
*   **`eslint`**: Code linting configuration.

## 2. Backend Dependencies (`functions/package.json`)

### Core Libraries
*   **`firebase-functions` (^4.8.0)**: The Firebase Cloud Functions SDK (v2). Required to define and deploy serverless functions (`onCall`).
*   **`firebase-admin` (^12.1.0)**: Firebase Admin SDK (included by default for elevated privileges, though not heavily utilized in the MVP).
*   **`googleapis` (^134.0.0)**: The official Google API client library for Node.js. Used specifically to interface with the YouTube Data API v3 (`youtube.playlistItems.list`).
*   **`@google/generative-ai` (^0.2.1)**: The official Google SDK for the Gemini API. Used to interact with the `gemini-2.5-flash` model for generating video summaries.
*   **`youtube-transcript` (^1.2.1)**: An unofficial scraper library used to extract YouTube closed captions without requiring OAuth authentication.
*   **`dotenv` (^16.4.5)**: Loads environment variables from a `.env` file into `process.env` during local execution.

### Runtime Environment
*   **Node.js**: Expected version 20 (as defined in `functions/package.json` engines block).
