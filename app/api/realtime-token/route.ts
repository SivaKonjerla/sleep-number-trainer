import { DefaultAzureCredential } from '@azure/identity';
import { NextRequest, NextResponse } from 'next/server';

// Get Azure OpenAI endpoint from environment
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT || 'gpt-4o-realtime-preview';

export async function GET(request: NextRequest) {
  try {
    // Get Azure AD token
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://cognitiveservices.azure.com/.default');

    // Construct WebSocket URL
    const wsUrl = AZURE_OPENAI_ENDPOINT
      .replace('https://', 'wss://')
      .replace(/\/$/, '') + '/openai/realtime';

    return NextResponse.json({
      token: tokenResponse.token,
      wsUrl: wsUrl,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      expiresOn: tokenResponse.expiresOnTimestamp,
    });
  } catch (error) {
    console.error('Failed to get realtime token:', error);
    return NextResponse.json(
      { error: 'Failed to get token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
