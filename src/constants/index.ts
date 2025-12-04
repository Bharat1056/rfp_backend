import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { proposalJsonSchema, rfpJsonSchema } from '../types';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

export const MODEL_NAME = "gemini-2.0-flash";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

Request: "${description}"

Generate a comprehensive RFP with:
- A clear, concise title
- Professional description
- Detailed list of items with specifications
- Budget estimate (if applicable)
- Delivery timeline (if applicable)
- Payment terms (if mentioned)
- Warranty requirements (if mentioned)

Be specific and professional in your output.`
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
