import { ProposalSchema, ProposalType, RfpSchema, RfpType } from "../types/index"
import {safeParseJson} from "../utils/helper"
import { emailTextPrompt, generateRFPPrompt, rfpModel, proposalModel, chatToRfpPrompt, genAI, MODEL_NAME } from '../constants';
import z from 'zod';

export const generateRfpFromDescription = async (description: string): Promise<RfpType> => {
  const prompt = generateRFPPrompt(description);

  try {
    const result = await rfpModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = safeParseJson(text);
    const validated = RfpSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.errors, null, 2));
      throw new Error(`Invalid RFP structure: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    console.error('RFP generation error:', error);
    throw new Error(`Failed to generate RFP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const parseProposalFromEmail = async (emailText: string): Promise<ProposalType> => {
  const prompt = emailTextPrompt(emailText);

  try {
    const result = await proposalModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in response');
    }

    const parsed = safeParseJson(text);

    const validated = ProposalSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.errors, null, 2));
      throw new Error(`Invalid proposal structure: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    throw new Error(`Failed to parse proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const rateProposal = async (rfp: RfpType, proposalData: any): Promise<{ score: number; reason: string }> => {
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

    Task:
    1. Score the proposal from 0 to 100 based on how well it matches the RFP.
       - Price within budget? (+pts)
       - Delivery meets deadline? (+pts)
       - Warranty matches? (+pts)
    2. Provide a short, 1-sentence reason for the score.

    Return JSON format only:
    {
      "score": number,
      "reason": "string"
    }
  `;

  try {
    const result = await proposalModel.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJson(text);
    return {
      score: parsed.score || 0,
      reason: parsed.reason || "No analysis provided."
    };
  } catch (error) {
    console.error("Error rating proposal:", error);
    return { score: 0, reason: "Failed to rate proposal." };
  }
};

export const generateRfpFromChat = async (chatHistory: { role: string; content: string }[]): Promise<RfpType> => {
  const prompt = chatToRfpPrompt(chatHistory);

  try {
    const result = await rfpModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) throw new Error('Empty response from Gemini API');

    const parsed = safeParseJson(text);
    return RfpSchema.parse(parsed);
  } catch (error) {
    console.error('RFP generation from chat error:', error);
    throw new Error(`Failed to generate RFP from chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const chatWithProcurementAI = async (history: { role: string; content: string }[], userMessage: string): Promise<{ message: string; suggestions: string[]; readyToGenerate: boolean }> => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Sanitize history
  let chatHistory = [...history];

  // 1. Remove the last message if it matches the current user message (to avoid duplication in prompt)
  if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user' && chatHistory[chatHistory.length - 1].content === userMessage) {
      chatHistory.pop();
  }

  // 2. Remove the first message if it is from 'model' (Gemini requirement: history must start with user)
  if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
  }

  const chat = model.startChat({
    history: chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
  });

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

    Return JSON:
    {
      "message": "next question string",
      "suggestions": ["chip1", "chip2", "chip3"],
      "readyToGenerate": boolean
    }
  `;

  try {
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();
    const parsed = safeParseJson(text);

    return {
      message: parsed.message || "I didn't understand that. Could you clarify?",
      suggestions: parsed.suggestions || [],
      readyToGenerate: parsed.readyToGenerate || false
    };
  } catch (error) {
    console.error("Chat error:", error);
    return { message: "Sorry, I'm having trouble connecting right now.", suggestions: [], readyToGenerate: false };
  }
};
