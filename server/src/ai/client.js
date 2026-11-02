const { GoogleGenAI } = require('@google/genai');
const { aiKey, aiModel } = require('../config/env');

class AiUnavailableError extends Error {}

const client = aiKey ? new GoogleGenAI({ apiKey: aiKey }) : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), ms)),
  ]);

async function complete({ system, user, maxTokens }) {
  if (!client) throw new AiUnavailableError('GEMINI_API_KEY is not set');

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model: aiModel,
          contents: user,
          config: {
            systemInstruction: system,
            // Gemini Flash models "think" first, and thinking tokens count against this cap,
            // so we leave headroom or the visible answer can come back empty.
            maxOutputTokens: maxTokens * 4,
          },
        }),
        20000
      );
      if (!response.text) throw new Error('Empty AI response');
      return response.text;
    } catch (err) {
      lastError = err;
      if (attempt < 2) await sleep(1500); // one retry covers short rate-limit or overload blips
    }
  }
  // Every failure mode becomes one error type, so callers need only one catch.
  throw new AiUnavailableError(lastError.message);
}

module.exports = { complete, AiUnavailableError };