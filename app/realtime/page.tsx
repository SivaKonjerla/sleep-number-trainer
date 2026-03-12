'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { personas, Persona, getRandomPersona } from '@/lib/personas';
import { generateSystemPrompt } from '@/lib/systemPrompt';

type SessionState = 'setup' | 'connecting' | 'active' | 'complete';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function RealtimePage() {
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Convert Float32 to PCM16
  const float32ToPcm16 = (float32Array: Float32Array): ArrayBuffer => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16.buffer;
  };

  // Convert PCM16 to Float32
  const pcm16ToFloat32 = (pcm16Buffer: ArrayBuffer): Float32Array => {
    const pcm16 = new Int16Array(pcm16Buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32;
  };

  // Play audio from queue
  const playAudioQueue = useCallback(() => {
    if (!audioContextRef.current || isPlayingRef.current || playbackQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const playNext = () => {
      if (playbackQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        setIsSpeaking(false);
        return;
      }

      const audioData = playbackQueueRef.current.shift()!;
      const audioBuffer = audioContextRef.current!.createBuffer(1, audioData.length, 24000);
      audioBuffer.copyToChannel(audioData, 0);

      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      source.onended = playNext;
      source.start();
    };

    playNext();
  }, []);

  // Connect to OpenAI Realtime API
  const connectToRealtime = async (persona: Persona) => {
    try {
      setSessionState('connecting');
      setError(null);

      // Get token from our API
      const tokenResponse = await fetch('/api/realtime-token');
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.details || tokenData.error);
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      // Get microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Connect to WebSocket
      const wsUrl = `${tokenData.wsUrl}?api-version=2024-10-01-preview&deployment=${tokenData.deployment}`;
      const ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${tokenData.token}`,
        'openai-beta.realtime-v1',
      ]);

      ws.onopen = () => {
        console.log('WebSocket connected');

        // Configure session
        const systemPrompt = generateSystemPrompt(persona);
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: systemPrompt,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'session.created':
          case 'session.updated':
            console.log('Session ready:', data.type);
            setSessionState('active');
            startAudioCapture();
            // Send opening line
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{ type: 'input_text', text: 'A customer just walked into the store. Greet them with your opening line.' }],
                },
              }));
              ws.send(JSON.stringify({ type: 'response.create' }));
            }, 500);
            break;

          case 'response.audio.delta':
            if (data.delta) {
              const audioData = Uint8Array.from(atob(data.delta), c => c.charCodeAt(0));
              const float32 = pcm16ToFloat32(audioData.buffer);
              playbackQueueRef.current.push(float32);
              playAudioQueue();
            }
            break;

          case 'response.audio_transcript.delta':
            if (data.delta) {
              setAiTranscript(prev => prev + data.delta);
            }
            break;

          case 'response.audio_transcript.done':
            if (data.transcript) {
              setMessages(prev => [...prev, { role: 'assistant', content: data.transcript }]);
              setAiTranscript('');
              setTurnCount(prev => prev + 1);
            }
            break;

          case 'conversation.item.input_audio_transcription.completed':
            if (data.transcript) {
              setMessages(prev => [...prev, { role: 'user', content: data.transcript }]);
              setTranscript('');
            }
            break;

          case 'input_audio_buffer.speech_started':
            setIsListening(true);
            // Stop AI audio when user starts speaking (interruption)
            playbackQueueRef.current = [];
            break;

          case 'input_audio_buffer.speech_stopped':
            setIsListening(false);
            break;

          case 'error':
            console.error('Realtime API error:', data.error);
            setError(data.error?.message || 'Unknown error');
            break;
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        setSessionState('setup');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        stopAudioCapture();
      };

      wsRef.current = ws;

    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setSessionState('setup');
    }
  };

  // Start capturing audio from microphone
  const startAudioCapture = () => {
    if (!mediaStreamRef.current || !audioContextRef.current || !wsRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToPcm16(inputData);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16)));

        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64,
        }));
      }
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
    processorRef.current = processor;
  };

  // Stop audio capture
  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Start session
  const startSession = (persona: Persona) => {
    setSelectedPersona(persona);
    setMessages([]);
    setTurnCount(0);
    connectToRealtime(persona);
  };

  // End session
  const endSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    setSessionState('complete');
  };

  // Reset
  const resetSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    setSessionState('setup');
    setSelectedPersona(null);
    setMessages([]);
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      stopAudioCapture();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-sleepnumber-blue text-white py-4 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold tracking-tight">
              Sleep<span className="font-light">Number</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-white/30"></div>
            <div className="hidden sm:block text-sm font-light">
              Voice Trainer (OpenAI Realtime)
            </div>
          </div>
          {sessionState !== 'setup' && (
            <button
              onClick={resetSession}
              className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              New Session
            </button>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Setup Screen */}
      {sessionState === 'setup' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Voice Sales Trainer
              </h1>
              <p className="text-gray-600">
                Practice with AI-powered real-time voice conversation.
                <br />
                <span className="text-sleepnumber-blue font-medium">
                  Powered by OpenAI Realtime API — Full Duplex Voice
                </span>
              </p>
            </div>

            <button
              onClick={() => startSession(getRandomPersona())}
              className="w-full bg-sleepnumber-blue hover:bg-sleepnumber-blue-dark text-white text-lg font-semibold py-4 px-6 rounded-xl shadow-lg transition-all hover:shadow-xl mb-6"
            >
              🎙️ Start with Random Customer
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">or choose a persona</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => startSession(persona)}
                  className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-sleepnumber-blue hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 text-sm">{persona.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{persona.personality}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connecting Screen */}
      {sessionState === 'connecting' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sleepnumber-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to voice service...</p>
          </div>
        </div>
      )}

      {/* Active Session */}
      {sessionState === 'active' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Persona Badge */}
          <div className="bg-white border-b px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sleepnumber-blue/10 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedPersona?.name}</div>
                  <div className="text-xs text-gray-500">{selectedPersona?.personality}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Turn {turnCount}</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-sleepnumber-blue text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {message.role === 'user' ? 'You' : 'Customer'}
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              </div>
            ))}

            {/* Live AI transcript */}
            {aiTranscript && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-900 rounded-bl-md">
                  <div className="text-xs font-medium mb-1 opacity-70">Customer</div>
                  <div className="text-sm">{aiTranscript}<span className="animate-pulse">▊</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="border-t bg-white p-6">
            <div className="flex items-center justify-center gap-6">
              {/* Listening indicator */}
              <div className={`flex items-center gap-2 ${isListening ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm">{isListening ? 'Listening...' : 'Waiting'}</span>
              </div>

              {/* Speaking indicator */}
              <div className={`flex items-center gap-2 ${isSpeaking ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm">{isSpeaking ? 'Speaking...' : 'Silent'}</span>
              </div>

              {/* End button */}
              <button
                onClick={endSession}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                End Session
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-3">
              Just speak naturally — full duplex voice, no button needed
            </p>
          </div>
        </div>
      )}

      {/* Complete Screen */}
      {sessionState === 'complete' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-sleepnumber-blue text-white px-6 py-4">
                <h2 className="text-xl font-bold">Session Complete</h2>
                <p className="text-sm text-white/80">{turnCount} turns with {selectedPersona?.name}</p>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Conversation Review</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`text-sm p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-sleepnumber-blue/10 ml-8'
                          : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <span className="font-medium">
                        {message.role === 'user' ? 'You: ' : 'Customer: '}
                      </span>
                      {message.content}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t">
                <button
                  onClick={resetSession}
                  className="w-full bg-sleepnumber-blue hover:bg-sleepnumber-blue-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Practice Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
