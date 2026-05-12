const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { google } = require("googleapis");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { YoutubeTranscript } = require("youtube-transcript");
require("dotenv").config();

// Initialize APIs
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractPlaylistId(url) {
  const regExp = /[&?]list=([^&]+)/i;
  const match = url.match(regExp);
  return match ? match[1] : url; // If it's already an ID, just return it
}

exports.getPlaylistVideos = onCall({ cors: true }, async (request) => {
  try {
    const { playlistUrl } = request.data;
    if (!playlistUrl) {
      throw new HttpsError("invalid-argument", "Playlist URL is required");
    }

    const playlistId = extractPlaylistId(playlistUrl);
    let videos = [];
    let nextPageToken = "";

    do {
      const res = await youtube.playlistItems.list({
        part: ["snippet"],
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const items = res.data.items || [];
      videos = videos.concat(
        items.map((item) => ({
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
        }))
      );

      nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);

    // Filter out private/deleted videos that might not have a title or have 'Private video' as title
    videos = videos.filter((v) => v.title && v.title !== "Private video" && v.title !== "Deleted video");

    return { videos };
  } catch (error) {
    console.error("Error fetching playlist:", error);
    throw new HttpsError("internal", "Failed to fetch playlist videos.", error.message);
  }
});

exports.summarizeVideo = onCall({ cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    const { videoId, title } = request.data;
    if (!videoId) {
      throw new HttpsError("invalid-argument", "Video ID is required");
    }

    // 1. Fetch transcript
    let transcriptText = "";
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcript.map((t) => t.text).join(" ");
    } catch (e) {
      console.warn(`No transcript found for video ${videoId}:`, e.message);
      transcriptText = "NO_TRANSCRIPT";
    }

    // 2. Generate summary
    const prompt = `You are a helpful YouTube video summarizer.
Your task is to summarize the video based on its transcript. If the transcript is not available, try your best to infer the topic from the title alone.
You MUST respond in valid JSON format ONLY with the following structure:
{
  "shortSummary": "A very high level, 1-2 sentence summary of the video.",
  "longSummary": "A detailed summary in 2-3 paragraphs highlighting key takeaways."
}

CRITICAL: The final summaries MUST be written in English, regardless of the original language of the video.

Video Title: ${title || "Unknown"}
Transcript:
${transcriptText === "NO_TRANSCRIPT" ? "No transcript available. Please summarize based on the title." : transcriptText.substring(0, 30000)}`;

    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await model.generateContent(prompt);
    let jsonText = response.response.text();
    
    // Strip potential markdown code blocks
    jsonText = jsonText.replace(/^```json/im, "").replace(/```$/im, "").trim();
    if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```[a-z]*\n/, '').replace(/```$/, '').trim();

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse failed. Raw text:", jsonText);
      throw new Error("Failed to parse AI response.");
    }

    return result;
  } catch (error) {
    console.error(`Error summarizing video ${request.data?.videoId}:`, error);
    throw new HttpsError("internal", "Failed to summarize video.", error.message);
  }
});
