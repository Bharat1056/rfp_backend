function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

export function safeParseJson(text: string): string {
  try {
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);

    // Handle case where API returns array instead of object
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error('Received empty array from API');
      }
      // Take first element if array
      console.warn('API returned array instead of object, using first element');
      return parsed[0];
    }

    return parsed;
  } catch (error) {
    console.error('JSON parsing failed:', error);
    console.error('Raw text:', text);
    throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
