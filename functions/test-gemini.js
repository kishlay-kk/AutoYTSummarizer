require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const prompt = `You are a helpful YouTube video summarizer.
Your task is to summarize the video based on its transcript.
You MUST respond in valid JSON format ONLY with the following structure:
{
  "shortSummary": "A very high level, 1-2 sentence summary of the video.",
  "longSummary": "A detailed summary in 2-3 paragraphs highlighting key takeaways."
}

Video Title: Test Video
Transcript: Hello this is a test.`;

    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    // Fire 20 requests to test rate limit
    console.log("Firing 20 requests...");
    const promises = Array.from({length: 20}).map((_, i) => 
      model.generateContent(prompt).catch(e => e.message)
    );
    const results = await Promise.all(promises);
    console.log("Results:");
    results.forEach((r, i) => {
      if (typeof r === 'string') console.log(`${i}: ERROR - ${r}`);
      else {
        try {
            const text = r.response.text();
            JSON.parse(text);
            console.log(`${i}: SUCCESS - JSON ok`);
        } catch(e) {
            console.log(`${i}: SUCCESS - JSON parse failed: ${r.response.text()}`);
        }
      }
    });

  } catch (e) {
    console.error("Fatal Error:", e.message);
  }
}
run();
