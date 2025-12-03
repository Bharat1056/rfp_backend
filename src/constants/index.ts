import { GoogleGenerativeAI } from '@google/generative-ai';

export const MODEL_NAME = "gemini-2.0-flash"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  }
});


export const generateRFPPrompt = (description: string): string => {
  return `You are an expert procurement assistant.
  Convert the following natural language procurement request into a structured RFP (Request for Proposal) JSON object.

  Request: "${description}"

  Return a JSON object with this exact structure:
  {
    "title": "Short descriptive title for the RFP",
    "description": "Refined professional description",
    "items": [
      {
        "name": "Name of the item",
        "qty": 0,
        "specs": "Technical specifications"
      }
    ],
    "budget": 0,
    "deliveryDays": 0,
    "paymentTerms": "Payment terms if mentioned",
    "warranty": "Warranty requirements if mentioned"
  }

  Note: budget, deliveryDays, paymentTerms, and warranty are optional fields. Only include them if mentioned in the request.

  Return ONLY the JSON object with no additional text.`
}

export const emailTextPrompt = (emailText: string): string => {
  return `You are an AI that extracts structured data from vendor proposal emails.

  Email Content:
  "${emailText}"

  Extract the relevant fields into a JSON object with this exact structure:
  {
    "totalPrice": 0,
    "deliveryDays": 0,
    "warranty": "Warranty offered",
    "priceBreakdown": [
      {
        "item": "Item name",
        "unit": 0,
        "qty": 0
      }
    ]
  }

  Note: All fields are optional. Only include them if found in the email.

  Return ONLY the JSON object with no additional text.`
}
