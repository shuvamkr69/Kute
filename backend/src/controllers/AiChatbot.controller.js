import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from "dotenv";
// dotenv.config({ path: "../.env" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("your api key is :           ", process.env.GEMINI_API_KEY);

export const getLoveAdvice = async (req, res) => {
  const { chatMessages, loggedInUserId, userInput } = req.body;

  try {
    const context = chatMessages
      .map(
        (m) => `(${m.senderId === loggedInUserId ? "You" : "Them"}): ${m.text}`
      )
      .join("\n");

    const prompt = `
You are CupidAI, a love expert who reads the entire chat between two users and gives personalized romantic advice.
The users are on a dating app named Kute, where they are chatting with each other. Curate your advice based on the chat history, and users prompt.

Chat Context:
${context}

User asked: "${userInput}"

Give friendly, helpful love advice in a couple sentences.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("AI Response:", text);
    res.status(200).json({ response: text.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Cupid had a brain freeze! 💔" });
  }
};
