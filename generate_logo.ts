import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateLogo() {
  try {
    console.log("Generating logo with Gemini...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A premium and elegant logo for a luxury transportation company named 'PASSAGEIRO EXPRESS Luxury'. The logo features stylized golden wings at the top, symmetrical, modern, and sophisticated, conveying speed, exclusivity, and high standards. The wings have a metallic gold gradient effect, looking refined and luxurious. Below the wings, the name 'PASSAGEIRO EXPRESS' in uppercase, using a modern, strong, elegant, and clean premium sans-serif typography in a metallic gold gradient. Below that, the word 'Luxury' in a delicate and sophisticated cursive/calligraphic font, with a thin horizontal golden line on each side of the word. Clean white background. Overall style: luxury, minimalist, premium, modern, corporate, high definition, professional finish, similar to luxury car brands or executive aviation. Soft lighting reflecting on the gold, light 3D emboss effect, clean visual, no visual pollution.",
          },
        ],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates returned.");
      return;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        const buffer = Buffer.from(base64EncodeString, 'base64');
        
        // Ensure public directory exists
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        const filePath = path.join(publicDir, 'logo.png');
        fs.writeFileSync(filePath, buffer);
        console.log("Logo successfully saved to " + filePath);
        return;
      }
    }
    console.log("No image data found in response.");
  } catch (error) {
    console.error("Error generating logo:", error);
  }
}

generateLogo();
