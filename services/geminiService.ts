import { GoogleGenAI, Type } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })

interface WordPair {
  common: string
  impostor: string
}

export const generateWordPair = async (
  language: string,
  similarity: "similar" | "random" = "similar"
): Promise<WordPair> => {
  try {
    let promptCondition = ""

    if (similarity === "random") {
      promptCondition = `The words must be nouns or verbs but completely unrelated to each other. For example "Apple" and "Car", or "Running" and "Swimming". They should have no obvious semantic connection.`
    } else {
      promptCondition = `The words must be semantically very similar but distinct enough to cause confusion during description (e.g., "Apple" vs "Pear", "School" vs "University", "Running" vs "Walking").`
    }

    const prompt = `Generate a pair of nouns or verbs for the social deduction game "Undercover" (or Spyfall) in ${language}. 
    The "common" word is for the majority, and the "impostor" word is for the spy. 
    ${promptCondition}
    Return ONLY valid JSON.`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            common: {
              type: Type.STRING,
              description: "The word for the majority of players",
            },
            impostor: {
              type: Type.STRING,
              description: "The word for the impostor(s)",
            },
          },
          required: ["common", "impostor"],
        },
      },
    })

    const jsonText = response.text
    if (!jsonText) throw new Error("Empty response from AI")

    return JSON.parse(jsonText) as WordPair
  } catch (error) {
    console.error("Gemini Generation Error:", error)
    // Fallback in case of API failure to keep the game playable
    return {
      common: "Error (AI Failed)",
      impostor: "Failure (Try Again)",
    }
  }
}
