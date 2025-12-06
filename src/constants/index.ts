import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { proposalJsonSchema, rfpJsonSchema, proposalRatingJsonSchema, chatResponseJsonSchema, ProposalType, RfpType } from '../types';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

export const MODEL_NAME = "gemini-2.0-flash";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// rfp model is used for generating rfp from natural language
export const rfpModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
    responseSchema: rfpJsonSchema
  }
});

// proposal model is used for parsing the proposal email
export const proposalModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
    responseSchema: proposalJsonSchema
  }
});

// rating model is used for rating the proposal
export const ratingModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
    responseSchema: proposalRatingJsonSchema
  }
});

// chat model is used for chat between user and AI
export const chatModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 1.0, // Higher temp depending on chat creativity, but structure is enforced
    responseMimeType: "application/json",
    responseSchema: chatResponseJsonSchema
  }
});

// generate rfp prompt is used for generating rfp from natural language
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

// chat to rfp prompt is used for generating rfp from chat history
export const chatToRfpPrompt = (chatHistory: { role: string; content: string }[]): string => {
  return `You are an expert procurement assistant.
  Based on the following conversation history between a user (User) and an AI assistant (Model), generate a structured RFP.

  Current Date: ${new Date().toISOString()}

  Conversation History:
  ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

  CRITICAL INSTRUCTION:
  You MUST extract the "Quantity" and "Specifications" from the chat history and include them in the "items" array.
  - "name": The item name (e.g. "Laptops")
  - "quantity": The extracted number (e.g. 50)
  - "specifications": The technical details (e.g. "16GB RAM, i7")`
}

// email text prompt is used for extracting proposal data from email
export const emailTextPrompt = (emailText: string): string => {
  return `
You are an AI that extracts structured proposal data.

Email Content (for reference only):
<<<EMAIL_START
${emailText}
EMAIL_END>>>

Task:
1. Determine whether the vendor confirmed the deal using phrases like:
   "done with the deal", "accepted", "agreed", "confirmed", etc.

2. If confirmed:
   - Locate the ORIGINAL RFP email inside the thread.
   - Extract values (fallback to null when missing):
        deliveryDays
        paymentTerms
        warranty
        totalPrice
        priceBreakdown [{ qty, item, unit }]

3. If vendor provides explicit values in their own message (like quantity, price, delivery), extract & override.
`;
};

// rate proposal prompt is used for rating the proposal
export const rateProposalPrompt = (rfp: RfpType, proposalData: ProposalType): string => {
    const prompt = `
      You are an AI procurement assistant. Evaluate the following vendor proposal against the RFP requirements.

      RFP Details:
      Title: ${rfp.title}
      Description: ${rfp.description}
      Budget: ${rfp.budget || 'N/A'}
      Delivery Required: ${rfp.deliveryDays || 'N/A'} days
      Payment Terms: ${rfp.paymentTerms || 'N/A'}
      Warranty Required: ${rfp.warranty || 'N/A'}
      Items: ${JSON.stringify(rfp.items)}

      Vendor Proposal:
      Total Price: ${proposalData.totalPrice || 'N/A'}
      Delivery Offered: ${proposalData.deliveryDays || 'N/A'} days
      Payment Terms: ${proposalData.paymentTerms || 'N/A'}
      Warranty Offered: ${proposalData.warranty || 'N/A'}

      Reasoning Task:
      1. Check for "Implicit Agreement". Did the vendor say "Agreed", "Confirmed", "Accepted", or "As per RFP"?
      2. IF AGREED: Then the Vendor's Price = RFP Budget, Delivery = RFP Delivery, etc.
      3. Score the proposal:
         - 100 IF "Agreed" (Perfect Match).
         - Else evaluate normally based on values provided.
    `;

    return prompt
}

// procurrent AI prompt is used for getting rfp from chat history
export const procurrentAIPrompt = (userMessage: string): string => {
  const prompt = `
    You are a strict but helpful procurement assistant. Your ONLY goal is to gather 6 specific pieces of information from the user to create an RFP.

    You MUST ask these questions in this EXACT order. Do not skip steps. Do not move to the next step until the current one is answered.

    Sequence:
    1. Item Name ("What are you looking to buy?")
       - Suggestions: "Laptops", "Office Furniture", "Servers"
    2. Quantity ("How many units do you need?")
       - Suggestions: "10", "50", "100"
    3. Specifications ("What are the technical specifications?")
       - Suggestions: "16GB RAM, 512GB SSD", "Ergonomic, Adjustable", "i7 Processor"
    4. Budget ("What is the estimated budget?")
       - Suggestions: "$500", "$1000", "$10000"
    5. Delivery Date ("When do you need this delivered?")
       - Suggestions: "Within 1 month", "Within 2 weeks", "Immediate"
    6. Warranty ("What warranty period do you require?")
       - Suggestions: "1 Year", "2 Years", "6 Months"

    Current Task:
    - Analyze the conversation history and the latest user message: "${userMessage}"
    - Determine which step we are currently on.
    - If the user provided the answer to the current step, move to the next step.
    - If the user's answer is unclear, ask for clarification on the CURRENT step.
    - If ALL 6 steps are answered satisfactorily, set "readyToGenerate" to true.

    Response Rules:
    - Your "message" should be the NEXT question in the sequence.
    - If readyToGenerate is true, your "message" should be "Great! I have all the details. Generating your RFP now..."
    - Provide 3 relevant "suggestions" chips for the NEXT question based on the examples above.
  `;

  return prompt
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

export const parseInboundEmail = upload.any();

export const prisma  = new PrismaClient()
