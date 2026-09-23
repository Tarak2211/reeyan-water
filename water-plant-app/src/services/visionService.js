const OpenAI = require('openai');
const fs = require('fs');
const { OPENAI_API_KEY } = require('../config/env');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Analyzes a jug delivery photo using GPT-4o vision.
 * Returns { jugsDelivered, jugsReturned, confidence, rawResponse }
 */
async function analyzeJugImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `You are an AI assistant for a mineral water delivery company. 
Analyze this delivery photo carefully.

Count the following:
1. FULL JUGS: Large blue/opaque sealed water jugs (20-litre) that are full — these are being DELIVERED to the customer.
2. EMPTY JUGS: Clear/transparent or open-top empty water jugs being RETURNED by the customer.

Respond ONLY with valid JSON in this exact format, no extra text:
{
  "full_jugs": <integer count of full/delivered jugs>,
  "empty_jugs": <integer count of empty/returned jugs>,
  "confidence": "<high|medium|low>",
  "notes": "<any relevant observations about image quality or ambiguity>"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  const rawContent = response.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(`Vision API returned non-JSON response: ${rawContent}`);
  }

  return {
    jugsDelivered: parseInt(parsed.full_jugs) || 0,
    jugsReturned: parseInt(parsed.empty_jugs) || 0,
    confidence: parsed.confidence || 'low',
    notes: parsed.notes || '',
    rawResponse: rawContent,
  };
}

module.exports = { analyzeJugImage };
