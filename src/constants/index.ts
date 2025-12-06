import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { proposalJsonSchema, rfpJsonSchema } from '../types';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

export const MODEL_NAME = "gemini-2.0-flash";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const rfpModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
    responseSchema: rfpJsonSchema
  }
});

export const proposalModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
    responseSchema: proposalJsonSchema
  }
});


export const generateRFPPrompt = (description: string): string => {
  return `You are an expert procurement assistant.
Convert the following natural language procurement request into a structured RFP (Request for Proposal).

Current Date: ${new Date().toISOString()}

Request: "${description}"

Generate a comprehensive RFP with:
- A clear, concise title
- Professional description
- Detailed list of items with specifications
- Budget estimate (if applicable)
- Delivery timeline (only extract the number of days from "within X months" relative to today. e.g. "within 1 month" = 30 days)
- Payment terms (if mentioned)
- Warranty requirements (if mentioned)

Be specific and professional in your output.`
}

export const chatToRfpPrompt = (chatHistory: { role: string; content: string }[]): string => {
  return `You are an expert procurement assistant.
  Based on the following conversation history between a user (User) and an AI assistant (Model), generate a structured RFP.

  Current Date: ${new Date().toISOString()}

  Conversation History:
  ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

  Generate a comprehensive RFP JSON with the following schema:
  {
    "title": "string",
    "description": "string",
    "items": [{ "name": "string", "quantity": number, "specifications": "string" }],
    "budget": number (optional),
    "deliveryDays": number (optional, calculated from relative dates like "within 1 month" -> 30),
    "paymentTerms": "string" (optional),
    "warranty": "string" (optional)
  }

  Return ONLY the JSON object.`
}

export const emailTextPrompt = (emailText: string): string => {
  return `You are an AI that extracts structured data from vendor proposal emails.

  Email Content:
  "${emailText}"

  Extract the relevant fields into a JSON object with this exact structure:
  {
    "totalPrice": 0,
    "deliveryDays": 0,
    "paymentTerms": "Payment terms if mentioned",
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

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

export const parseInboundEmail = upload.any();

export const prisma  = new PrismaClient()
