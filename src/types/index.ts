import { z } from 'zod';
import { Schema, SchemaType } from '@google/generative-ai';

export const RfpItemSchema = z.object({
  name: z.string().describe("Name of the item"),
  qty: z.number().describe("Quantity required"),
  specs: z.string().describe("Technical specifications")
});

export const RfpSchema = z.object({
  title: z.string().describe("Short descriptive title for the RFP"),
  description: z.string().describe("Refined professional description"),
  items: z.array(RfpItemSchema).describe("List of items to be procured"),
  budget: z.number().nullable().optional().describe("Estimated budget if mentioned"),
  deliveryDays: z.number().nullable().optional().describe("Required delivery days if mentioned"),
  paymentTerms: z.string().nullable().optional().describe("Payment terms if mentioned"),
  warranty: z.string().nullable().optional().describe("Warranty requirements if mentioned"),
  status: z.string().default("Pending").describe("Status of the RFP")
});

export type RfpType = z.infer<typeof RfpSchema>;

export const PriceBreakdownItemSchema = z.object({
  item: z.string().nullable().optional().describe("Item name"),
  unit: z.number().nullable().optional().describe("Unit price"),
  qty: z.number().nullable().optional().describe("Quantity")
});

export const ProposalSchema = z.object({
  totalPrice: z.number().describe("Total price quoted"),
  deliveryDays: z.number().describe("Delivery timeline in days"),
  paymentTerms: z.string().describe("Payment terms if mentioned"),
  warranty: z.string().describe("Warranty offered"),
  priceBreakdown: z.array(PriceBreakdownItemSchema).describe("Breakdown of prices per item")
});

export type ProposalType = z.infer<typeof ProposalSchema>;

export const rfpJsonSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "Short descriptive title for the RFP"
    },
    description: {
      type: SchemaType.STRING,
      description: "Refined professional description"
    },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Name of the item"
          },
          qty: {
            type: SchemaType.NUMBER,
            description: "Quantity required"
          },
          specs: {
            type: SchemaType.STRING,
            description: "Technical specifications"
          }
        },
        required: ["name", "qty", "specs"]
      },
      description: "List of items to be procured"
    },
    budget: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Estimated budget if mentioned"
    },
    deliveryDays: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Required delivery days if mentioned"
    },
    paymentTerms: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Payment terms if mentioned"
    },
    warranty: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Warranty requirements if mentioned"
    }
  },
  required: ["title", "description", "items"]
};

export const proposalJsonSchema: Schema = {
  type:SchemaType.OBJECT,
  properties: {
    totalPrice: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Total price quoted"
    },
    deliveryDays: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Delivery timeline in days"
    },
    paymentTerms: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Payment terms if mentioned"
    },
    warranty: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Warranty offered"
    },
    priceBreakdown: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: {
            type: SchemaType.STRING,
            description: "Item name"
          },
          unit: {
            type: SchemaType.NUMBER,
            description: "Unit price"
          },
          qty: {
            type: SchemaType.NUMBER,
            description: "Quantity"
          }
        },
        required: ["item"]
      },
      nullable: true,
      description: "Breakdown of prices per item"
    }
  }
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

export interface InboundEmailPayload {
  headers: string;
  dkim: string;
  to: string;
  from: string;
  sender_ip: string;
  spam_report?: string;
  envelope: string;
  subject: string;
  spam_score?: string;
  charsets: string;
  SPF: string;
  text?: string;
  html?: string;
  attachments?: string;
  'attachment-info'?: string;
  [key: string]: any;
}

export const ProposalRatingSchema = z.object({
  score: z.number(),
  reason: z.string(),
});

export type ProposalRatingType = z.infer<typeof ProposalRatingSchema>;

export const proposalRatingJsonSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    score: {
      type: SchemaType.NUMBER,
      description: "Evaluation score from 0 to 100",
      nullable: false
    },
    reason: {
      type: SchemaType.STRING,
      description: "Reasoning behind the score",
      nullable: false
    }
  },
  required: ["score", "reason"]
};

export const chatResponseJsonSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    message: {
      type: SchemaType.STRING,
      description: "The next question or response message",
      nullable: false
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        description: "Suggested response chip"
      },
      description: "List of 3 relevant suggestion chips",
      nullable: false
    },
    readyToGenerate: {
      type: SchemaType.BOOLEAN,
      description: "True if all 6 steps are answered securely",
      nullable: false
    }
  },
  required: ["message", "suggestions", "readyToGenerate"]
};
