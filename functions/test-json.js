require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const prompt = `Say hi`;

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await model.generateContent(prompt);
    console.log("Success with gemini-2.0-flash");
  } catch (error) {
    console.error("Error with gemini-2.0-flash:", error.message);
  }
}
run();
