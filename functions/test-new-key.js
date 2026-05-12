const { GoogleGenerativeAI } = require("@google/generative-ai");
const ai = new GoogleGenerativeAI("AIzaSyB0EeUqmcrTlALO7tup6xF5w1l3isAS334");

async function testModel(modelName) {
  try {
    const model = ai.getGenerativeModel({ 
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await model.generateContent("Say hi");
    console.log(`Success with ${modelName}:`, response.response.text());
  } catch (error) {
    console.error(`Error with ${modelName}:`, error.message);
  }
}

async function run() {
    await testModel("gemini-2.5-pro");
    await testModel("gemini-3-flash-preview");
    await testModel("gemini-2.0-flash-lite");
}
run();
