require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const prompt = `Say hi`;

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await model.generateContent(prompt);
    console.log("Success with gemini-flash-latest:", response.response.text());
  } catch (error) {
    console.error("Error with gemini-flash-latest:", error.message);
  }
}
run();
