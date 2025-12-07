import { ProposalSchema, ProposalType, RfpSchema, RfpType, ProposalRatingType } from "../types/index"
import {safeParseJson} from "../utils/helper"
import { emailTextPrompt, generateRFPPrompt, chatToRfpPrompt, openai, MODEL_NAME, rateProposalPrompt, procurrentAIPrompt } from '../constants';
import z from 'zod';

export const generateRfpFromDescription = async (description: string): Promise<RfpType> => {
  const prompt = generateRFPPrompt(description);

  const rfpSchema = {
    type: "object",
    properties: {
      title: { type: "string", description: "Short descriptive title for the RFP" },
      description: { type: "string", description: "Refined professional description" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the item" },
            qty: { type: "number", description: "Quantity required" },
            specs: { type: "string", description: "Technical specifications" }
          },
          required: ["name", "qty", "specs"],
          additionalProperties: false
        },
        description: "List of items to be procured"
      },
      budget: { type: ["number", "null"], description: "Estimated budget if mentioned" },
      deliveryDays: { type: ["number", "null"], description: "Required delivery days if mentioned" },
      paymentTerms: { type: ["string", "null"], description: "Payment terms if mentioned" },
      warranty: { type: ["string", "null"], description: "Warranty requirements if mentioned" },
      status: { type: "string", description: "Status of the RFP", enum: ["Pending", "Open", "Closed"] }
    },
    required: ["title", "description", "items", "budget", "deliveryDays", "paymentTerms", "warranty", "status"],
    additionalProperties: false
  };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant that generates RFPs." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "rfp_response",
          strict: true,
          schema: rfpSchema
        }
      }
    });

    const text = completion.choices[0].message.content;

    if (!text) {
      throw new Error('Empty response from Grok API');
    }

    const parsed = safeParseJson(text);
    // Transform nulls to undefined or handle as needed by Zod schema if it doesn't accept nulls where we expect valid types
    // Our Zod schema allows nullable for these fields so it should be fine.
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

  const proposalSchema = {
    type: "object",
    properties: {
      totalPrice: { type: "number", description: "Total price quoted" },
      deliveryDays: { type: "number", description: "Delivery timeline in days" },
      paymentTerms: { type: "string", description: "Payment terms if mentioned" },
      warranty: { type: "string", description: "Warranty offered" },
      priceBreakdown: {
        type: "array",
        items: {
            type: "object",
            properties: {
                item: { type: ["string", "null"], description: "Item name" },
                unit: { type: ["number", "null"], description: "Unit price" },
                qty: { type: ["number", "null"], description: "Quantity" }
            },
            required: ["item", "unit", "qty"],
            additionalProperties: false
        },
        description: "Breakdown of prices per item"
      }
    },
    required: ["totalPrice", "deliveryDays", "paymentTerms", "warranty", "priceBreakdown"],
    additionalProperties: false
  };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant that parses proposals." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
            name: "proposal_response",
            strict: true,
            schema: proposalSchema
        }
      }
    });

    const text = completion.choices[0].message.content;

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

  const ratingSchema = {
    type: "object",
    properties: {
      score: { type: "number", description: "Evaluation score from 0 to 100" },
      reason: { type: "string", description: "Reasoning behind the score" }
    },
    required: ["score", "reason"],
    additionalProperties: false
  };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant that rates proposals." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
            name: "rating_response",
            strict: true,
            schema: ratingSchema
        }
      }
    });

    const text = completion.choices[0].message.content;
    const parsed = safeParseJson(text || "{}");

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

  const rfpSchema = {
    type: "object",
    properties: {
      title: { type: "string", description: "Short descriptive title for the RFP" },
      description: { type: "string", description: "Refined professional description" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the item" },
            qty: { type: "number", description: "Quantity required" },
            specs: { type: "string", description: "Technical specifications" }
          },
          required: ["name", "qty", "specs"],
          additionalProperties: false
        },
        description: "List of items to be procured"
      },
      budget: { type: ["number", "null"], description: "Estimated budget if mentioned" },
      deliveryDays: { type: ["number", "null"], description: "Required delivery days if mentioned" },
      paymentTerms: { type: ["string", "null"], description: "Payment terms if mentioned" },
      warranty: { type: ["string", "null"], description: "Warranty requirements if mentioned" },
      status: { type: "string", description: "Status of the RFP", enum: ["Pending", "Open", "Closed"] }
    },
    required: ["title", "description", "items", "budget", "deliveryDays", "paymentTerms", "warranty", "status"],
    additionalProperties: false
  };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful assistant that generates RFPs from chat." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
            name: "rfp_from_chat_response",
            strict: true,
            schema: rfpSchema
        }
      }
    });

    const text = completion.choices[0].message.content;

    if (!text) throw new Error('Empty response from Grok API');

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

  // Convert history to OpenAI format
  const messages: any[] = chatHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content }));

  const prompt = procurrentAIPrompt(userMessage);

  // Append current prompt/user message
  messages.push({ role: "user", content: prompt });

  const chatSchema = {
    type: "object",
    properties: {
      message: { type: "string", description: "The next question or response message" },
      suggestions: {
          type: "array",
          items: { type: "string" },
          description: "List of 3 relevant suggestion chips"
      },
      readyToGenerate: { type: "boolean", description: "True if all 6 steps are answered securely" }
    },
    required: ["message", "suggestions", "readyToGenerate"],
    additionalProperties: false
  };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
          { role: "system", content: "You are a helpful procurement assistant." },
          ...messages
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
            name: "procurement_chat_response",
            strict: true,
            schema: chatSchema
        }
      }
    });

    const text = completion.choices[0].message.content;
    const parsed = safeParseJson(text || "{}");

    return {
      message: parsed.message || "I didn't understand that. Could you clarify?",
      suggestions: parsed.suggestions || [],
      readyToGenerate: parsed.readyToGenerate || false
    };
  } catch (error) {
    return { message: "Sorry, I'm having trouble connecting right now.", suggestions: [], readyToGenerate: false };
  }
};
