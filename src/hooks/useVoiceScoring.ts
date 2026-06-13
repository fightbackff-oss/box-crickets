import { useEffect, useState, useCallback } from 'react';

type VoiceCommand = number | 'wicket' | 'wide' | 'noball' | 'undo';

export function useVoiceScoring(onCommand: (command: VoiceCommand) => void) {
  const [isListening, setIsListening] = useState(false);
  const [lastWords, setLastWords] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      setLastWords(transcript);

      // Parse commands
      if (transcript.includes('zero') || transcript.includes('dot') || transcript.includes('no run')) {
        onCommand(0);
      } else if (transcript.includes('one') || transcript === '1') {
        onCommand(1);
      } else if (transcript.includes('two') || transcript === '2') {
        onCommand(2);
      } else if (transcript.includes('three') || transcript === '3') {
        onCommand(3);
      } else if (transcript.includes('four') || transcript === '4' || transcript.includes('boundary')) {
        onCommand(4);
      } else if (transcript.includes('six') || transcript === '6' || transcript.includes('maximum')) {
        onCommand(6);
      } else if (transcript.includes('wicket') || transcript.includes('out') || transcript.includes('catch') || transcript.includes('bowled')) {
        onCommand('wicket');
      } else if (transcript.includes('wide')) {
        onCommand('wide');
      } else if (transcript.includes('no ball')) {
        onCommand('noball');
      } else if (transcript.includes('undo') || transcript.includes('cancel')) {
        onCommand('undo');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [isSupported, onCommand]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening, isSupported, lastWords };
}
