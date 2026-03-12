'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { personas, Persona, getRandomPersona } from '@/lib/personas';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type SessionState = 'setup' | 'active' | 'complete';

export default function Home() {
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [coachingReport, setCoachingReport] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech synthesis and get voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        // Filter for English voices, prefer female voices for customer persona
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        setAvailableVoices(englishVoices);

        // Try to find a good default voice
        const preferredVoice = englishVoices.find(v =>
          v.name.includes('Samantha') ||
          v.name.includes('Karen') ||
          v.name.includes('Moira') ||
          v.name.includes('Female')
        ) || englishVoices[0];

        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    initSpeechRecognition();
  }, [initSpeechRecognition]);

  // Text to speech function
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Clean up the text - remove markdown and special characters
    const cleanText = text
      .replace(/\[SESSION_COMPLETE\]/g, '')
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\|/g, '')
      .replace(/-{2,}/g, '')
      .replace(/\n{2,}/g, '. ')
      .trim();

    // Check if this is a coaching report
    if (text.includes('Coaching Report')) {
      // Don't speak the full report, just announce it
      const announcement = new SpeechSynthesisUtterance('Session complete. Your coaching report is now displayed on screen.');
      if (selectedVoice) announcement.voice = selectedVoice;
      announcement.rate = 1.0;
      announcement.pitch = 1.0;
      synthRef.current.speak(announcement);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [selectedVoice, voiceEnabled]);

  // Start listening
  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop listening and send message
  const stopListeningAndSend = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);

      if (transcript.trim()) {
        await sendMessage(transcript.trim());
        setTranscript('');
      }
    }
  };

  // Send message to API
  const sendMessage = async (content: string) => {
    if (!selectedPersona) return;

    const newMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          persona: selectedPersona,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('API error:', data.error);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Check if session is complete
      if (data.isComplete) {
        setSessionState('complete');
        setCoachingReport(data.message);
      }

      // Speak the response
      speak(data.message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start session with selected persona
  const startSession = (persona: Persona) => {
    setSelectedPersona(persona);
    setMessages([]);
    setCoachingReport(null);
    setSessionState('active');

    // Add the customer's opening line
    const openingMessage: Message = {
      role: 'assistant',
      content: `*walks into the store* ${persona.openingLine}`,
    };
    setMessages([openingMessage]);

    // Speak the opening line
    setTimeout(() => {
      speak(persona.openingLine);
    }, 500);
  };

  // Start with random persona
  const startRandomSession = () => {
    const randomPersona = getRandomPersona();
    startSession(randomPersona);
  };

  // End session
  const endSession = async () => {
    if (transcript.trim()) {
      await sendMessage(transcript.trim() + ' [End session]');
    } else {
      await sendMessage('End session');
    }
    setTranscript('');
  };

  // Reset to setup
  const resetSession = () => {
    setSessionState('setup');
    setSelectedPersona(null);
    setMessages([]);
    setCoachingReport(null);
    setTranscript('');
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

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
              Sales Trainer
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

      {/* Setup Screen */}
      {sessionState === 'setup' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Step 1: Connect & Discover
              </h1>
              <p className="text-gray-600">
                Practice your discovery skills with AI-powered customer simulations.
                <br />
                <span className="text-sleepnumber-blue font-medium">Speak naturally — this is a voice-based training.</span>
              </p>
            </div>

            {/* Voice Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Customer Voice</span>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value);
                    if (voice) setSelectedVoice(voice);
                  }}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sleepnumber-blue focus:border-transparent"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Start */}
            <button
              onClick={startRandomSession}
              className="w-full bg-sleepnumber-blue hover:bg-sleepnumber-blue-dark text-white text-lg font-semibold py-4 px-6 rounded-xl shadow-lg transition-all hover:shadow-xl mb-6"
            >
              Start with Random Customer
            </button>

            {/* Or choose persona */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">or choose a specific persona</span>
              </div>
            </div>

            {/* Persona Grid */}
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

      {/* Active Session */}
      {sessionState === 'active' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Persona Badge */}
          <div className="bg-white border-b px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sleepnumber-blue/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-sleepnumber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">{selectedPersona?.name}</div>
                <div className="text-xs text-gray-500">{selectedPersona?.personality}</div>
              </div>
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
                    {message.role === 'user' ? 'You (Sales Pro)' : 'Customer'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Controls */}
          <div className="border-t bg-white p-6">
            {/* Current transcript */}
            {transcript && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                "{transcript}"
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              {/* Speaking indicator / Stop button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-sleepnumber-blue rounded-full waveform-bar"
                        style={{ height: '16px' }}
                      ></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">Customer speaking... (tap to stop)</span>
                </button>
              )}

              {/* Main voice button */}
              {!isSpeaking && (
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListeningAndSend}
                  onTouchStart={startListening}
                  onTouchEnd={stopListeningAndSend}
                  disabled={isProcessing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isListening
                      ? 'bg-red-500 voice-button-active scale-110'
                      : 'bg-sleepnumber-blue hover:bg-sleepnumber-blue-dark'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>
              )}

              {/* End Session */}
              <button
                onClick={endSession}
                disabled={isProcessing || isListening}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                End Session
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-3">
              {isListening ? 'Release to send...' : 'Hold to speak'}
            </p>
          </div>
        </div>
      )}

      {/* Complete / Coaching Report */}
      {sessionState === 'complete' && coachingReport && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-sleepnumber-blue text-white px-6 py-4">
                <h2 className="text-xl font-bold">Session Complete</h2>
                <p className="text-sm text-white/80">Review your performance below</p>
              </div>

              <div className="p-6">
                {/* Parse and display the coaching report */}
                <div className="prose prose-sm max-w-none">
                  {coachingReport.split('\n').map((line, i) => {
                    if (line.includes('Score:')) {
                      const score = line.match(/(\d+)\/100/)?.[1] || '0';
                      return (
                        <div key={i} className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="text-4xl font-bold text-sleepnumber-blue">{score}</div>
                          <div className="text-gray-600">/100 points</div>
                        </div>
                      );
                    }
                    if (line.startsWith('###')) {
                      return <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">{line.replace(/###/g, '').trim()}</h3>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={i} className="font-semibold text-gray-800 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                    }
                    if (line.startsWith('|')) {
                      return null; // Skip table formatting for now
                    }
                    if (line.trim()) {
                      return <p key={i} className="text-gray-600 mb-2">{line.replace(/\*\*/g, '').replace('[SESSION_COMPLETE]', '')}</p>;
                    }
                    return null;
                  })}
                </div>

                {/* Conversation Review */}
                <div className="mt-8 pt-6 border-t">
                  <h4 className="font-semibold text-gray-800 mb-4">Conversation Review</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {messages.slice(0, -1).map((message, index) => (
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

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
