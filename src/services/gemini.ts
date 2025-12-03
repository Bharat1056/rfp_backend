
import dotenv from 'dotenv';
import { ProposalSchema, ProposalType, RfpSchema, RfpType } from "../types/index"
import { cleanJsonResponse } from '../utils/helper';
import { emailTextPrompt, generateRFPPrompt, model } from '../constants';

dotenv.config();

export const generateRfpFromDescription = async (description: string): Promise<RfpType> => {
  const prompt = generateRFPPrompt(description);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in response');
    }

    // Clean and parse JSON
    const cleanedText = cleanJsonResponse(text);
    const parsed = JSON.parse(cleanedText);

    // Validate with Zod
    const validated = RfpSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('API or parsing error:', error);
    throw new Error(`Failed to generate RFP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const parseProposalFromEmail = async (emailText: string): Promise<ProposalType> => {
  const prompt = emailTextPrompt(emailText);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in response');
    }

    // Clean and parse JSON
    const cleanedText = cleanJsonResponse(text);
    const parsed = JSON.parse(cleanedText);

    // Validate with Zod
    const validated = ProposalSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('API or parsing error:', error);
    throw new Error(`Failed to parse proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
