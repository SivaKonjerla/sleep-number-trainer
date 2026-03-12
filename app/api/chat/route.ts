import { DefaultAzureCredential } from '@azure/identity';
import { NextRequest, NextResponse } from 'next/server';
import { generateSystemPrompt } from '@/lib/systemPrompt';
import { Persona } from '@/lib/personas';

// Azure AI Foundry configuration
const AZURE_FOUNDRY_URL = process.env.ANTHROPIC_FOUNDRY_BASE_URL || 'https://sn-aifoundry-dev.services.ai.azure.com/anthropic';
const AZURE_MODEL = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'cogdep-aifoundry-dev-eus2-claude-sonnet-4-5';

// Get Azure access token
async function getAzureToken(): Promise<string> {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken('https://cognitiveservices.azure.com/.default');
  return tokenResponse.token;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, persona } = await request.json();

    // Get fresh Azure token
    const azureToken = await getAzureToken();

    const systemPrompt = generateSystemPrompt(persona as Persona);

    // Call Azure AI Foundry directly with proper auth header
    const response = await fetch(`${AZURE_FOUNDRY_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${azureToken}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AZURE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get response', details: `${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const assistantMessage = data.content?.[0]?.type === 'text'
      ? data.content[0].text
      : '';

    return NextResponse.json({
      message: assistantMessage,
      isComplete: assistantMessage.includes('[SESSION_COMPLETE]')
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
