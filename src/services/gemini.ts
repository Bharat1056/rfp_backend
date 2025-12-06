import { ProposalSchema, ProposalType, RfpSchema, RfpType, ProposalRatingType } from "../types/index"
import {safeParseJson} from "../utils/helper"
import { emailTextPrompt, generateRFPPrompt, rfpModel, proposalModel, ratingModel, chatModel, chatToRfpPrompt, genAI, MODEL_NAME, rateProposalPrompt, procurrentAIPrompt } from '../constants';
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
      throw new Error(`Invalid proposal structure: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    throw new Error(`Failed to parse proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const rateProposal = async (
  rfp: RfpType,
  proposalData: ProposalType
): Promise<ProposalRatingType> => {
  const prompt = rateProposalPrompt(rfp, proposalData);

  try {
    const result = await ratingModel.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJson(text);

    return {
      score: parsed.score || 0,
      reason: parsed.reason || "No analysis provided."
    };
  } catch (error) {
    return { score: 0, reason: "Failed to rate proposal." };
  }
};

export const generateRfpFromChat = async (
  chatHistory: {
    role: string;
    content: string
  }[]
): Promise<RfpType> => {
  const prompt = chatToRfpPrompt(chatHistory);

  try {
    const result = await rfpModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) throw new Error('Empty response from Gemini API');

    const parsed = safeParseJson(text);
    return RfpSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Failed to generate RFP from chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const chatWithProcurementAI = async (
    history: { role: string; content: string }[],
    userMessage: string
): Promise<{
      message: string;
      suggestions: string[];
      readyToGenerate: boolean
    }> => {

  let chatHistory = [...history];

  if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user' && chatHistory[chatHistory.length - 1].content === userMessage) {
      chatHistory.pop();
  }

  if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
  }

  const chat = chatModel.startChat({
    history: chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
  });

  const prompt = procurrentAIPrompt(userMessage);

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
    return { message: "Sorry, I'm having trouble connecting right now.", suggestions: [], readyToGenerate: false };
  }
};
