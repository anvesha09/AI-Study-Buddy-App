import React, { useState, useCallback } from 'react';
import { SummaryLength, AppContext } from '../types';
import { geminiService } from '../services/geminiService';
import Spinner from './Spinner';

interface StudyViewProps {
  context: AppContext;
}

const StudyView: React.FC<StudyViewProps> = ({ context }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSummarize = useCallback(async (length: SummaryLength) => {
    if (!context) {
      setError('Please provide some text or a file to summarize.');
      return;
    }
    setError('');
    setIsLoading(true);
    setSummary('');
    const result = await geminiService.getSummary(context, length);
    setSummary(result);
    setIsLoading(false);
  }, [context]);

  const SummaryButton: React.FC<{length: SummaryLength; label: string;}> = ({length, label}) => (
     <button
        onClick={() => handleSummarize(length)}
        disabled={isLoading || !context}
        className="flex-1 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {label}
      </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <h3 className="text-xl font-bold text-slate-800">AI Summarizer</h3>
        <p className="text-slate-600">Generate a concise summary of your document.</p>
        <div className="flex flex-col sm:flex-row gap-2">
            <SummaryButton length={SummaryLength.SHORT} label="Short" />
            <SummaryButton length={SummaryLength.MEDIUM} label="Medium" />
            <SummaryButton length={SummaryLength.DETAILED} label="Detailed" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {(isLoading || summary) && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner />
              <p className="text-slate-600 font-medium">Generating summary...</p>
            </div>
          ) : (
             <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800">Summary</h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{summary}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyView;
