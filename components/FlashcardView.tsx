import React, { useState, useCallback } from 'react';
import { AppContext, Flashcard } from '../types';
import { geminiService } from '../services/geminiService';
import Spinner from './Spinner';
import Icon from './Icon';

interface FlashcardViewProps {
  context: AppContext;
}

const FlashcardItem: React.FC<{ card: Flashcard }> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFlip();
        }
    };

    return (
        <div 
            className={`w-full h-48 card-container cursor-pointer ${isFlipped ? 'flipped' : ''}`} 
            onClick={handleFlip}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-pressed={isFlipped}
            title={isFlipped ? 'Click to see term' : 'Click to see definition'}
        >
            <div className="card-inner">
                <div className="card-face card-front bg-white shadow-md border border-slate-200">
                    <p className="text-lg font-semibold text-center text-slate-800">{card.term}</p>
                </div>
                <div className="card-face card-back bg-blue-600 text-white shadow-lg">
                    <p className="text-center">{card.definition}</p>
                </div>
            </div>
        </div>
    );
};

const FlashcardView: React.FC<FlashcardViewProps> = ({ context }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [numCards, setNumCards] = useState<number>(6);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!context) {
      setError('Please provide some text or a file to generate flashcards from.');
      return;
    }
    setError('');
    setIsLoading(true);
    setFlashcards([]);
    const result = await geminiService.generateFlashcards(context, numCards);
    setFlashcards(result);
    setIsLoading(false);
  }, [context, numCards]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Flashcard Generator</h3>
        <p className="text-slate-600">Create digital flashcards from key concepts in your document.</p>
        
        <div className="space-y-2">
          <label htmlFor="numCards" className="text-sm font-medium text-slate-700">
            Number of Flashcards: <span className="font-bold text-blue-600">{numCards}</span>
          </label>
          <input
            id="numCards"
            type="range"
            min="2"
            max="12"
            step="2"
            value={numCards}
            onChange={(e) => setNumCards(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <button
          onClick={handleGenerateFlashcards}
          disabled={isLoading || !context}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner /> : 'Generate Flashcards'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {isLoading && (
         <div className="flex flex-col items-center gap-4 py-8">
            <Spinner />
            <p className="text-slate-600 font-medium">Generating flashcards...</p>
          </div>
      )}

      {flashcards.length > 0 && !isLoading && (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Your Flashcards</h3>
            <p className="text-sm text-slate-500">Click on a card to flip it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashcards.map((card, index) => (
                    <FlashcardItem key={index} card={card} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardView;