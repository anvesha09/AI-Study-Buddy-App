import React, { useState, useCallback, useMemo } from 'react';
import { QuizType, QuizQuestion, AppContext } from '../types';
import { geminiService } from '../services/geminiService';
import Spinner from './Spinner';
import Icon from './Icon';

interface QuizViewProps {
  context: AppContext;
}

const QuizView: React.FC<QuizViewProps> = ({ context }) => {
  const [quizType, setQuizType] = useState<QuizType>(QuizType.MCQ);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // State for interactive quiz
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const score = useMemo(() => {
    if (!isSubmitted) return 0;
    return quiz.reduce((acc, q, index) => {
        return selectedAnswers[index] === q.answer ? acc + 1 : acc;
    }, 0);
  }, [isSubmitted, quiz, selectedAnswers]);

  const handleGenerateQuiz = useCallback(async () => {
    if (!context) {
      setError('Please provide some text or a file to generate a quiz from.');
      return;
    }
    setError('');
    setIsLoading(true);
    setQuiz([]);
    setSelectedAnswers({});
    setIsSubmitted(false);
    const result = await geminiService.generateQuiz(context, quizType, numQuestions);
    setQuiz(result);
    setIsLoading(false);
  }, [context, quizType, numQuestions]);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };
  
  const handleSubmit = () => {
    setIsSubmitted(true);
  };
  
  const getOptionStyle = (questionIndex: number, option: string): string => {
      if (!isSubmitted) {
          return selectedAnswers[questionIndex] === option
              ? 'bg-blue-200 border-blue-400'
              : 'bg-white hover:bg-slate-100';
      }
      
      const question = quiz[questionIndex];
      const isCorrect = option === question.answer;
      const isSelected = option === selectedAnswers[questionIndex];

      if(isCorrect) return 'bg-green-100 border-green-500 text-green-800 font-semibold';
      if(isSelected && !isCorrect) return 'bg-red-100 border-red-500 text-red-800';
      
      return 'bg-white';
  };
  
  const QuizTypeButton: React.FC<{type: QuizType}> = ({ type }) => (
    <button
        onClick={() => setQuizType(type)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        quizType === type
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-100'
        }`}
    >
        {type}
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Quiz Generator</h3>
        <p className="text-slate-600">Create a practice quiz from your document.</p>
        
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Question Type</label>
            <div className="flex flex-wrap gap-2">
                <QuizTypeButton type={QuizType.MCQ} />
                <QuizTypeButton type={QuizType.TRUE_FALSE} />
                <QuizTypeButton type={QuizType.FILL_IN_BLANK} />
                <QuizTypeButton type={QuizType.SHORT_ANSWER} />
            </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="numQuestions" className="text-sm font-medium text-slate-700">
            Number of Questions: <span className="font-bold text-blue-600">{numQuestions}</span>
          </label>
          <input
            id="numQuestions"
            type="range"
            min="1"
            max="10"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <button
          onClick={handleGenerateQuiz}
          disabled={isLoading || !context}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner /> : 'Generate Quiz'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {quiz.length > 0 && !isLoading && (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-bold text-slate-800">Your Quiz</h3>
                 {isSubmitted && (
                    <div className="w-full sm:w-auto text-center px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold text-lg">
                        Your Score: {score} / {quiz.length}
                    </div>
                 )}
            </div>
            
            <ul className="space-y-6">
            {quiz.map((q, index) => (
              <li key={index} className="border-t border-slate-200 pt-6">
                <p className="font-semibold text-slate-800 mb-4">{index + 1}. {q.question}</p>
                
                {q.type === QuizType.MCQ && q.options && (
                  <div className="space-y-3">
                    {q.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSelectAnswer(index, opt)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-3 border rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-3 ${getOptionStyle(index, opt)}`}
                      >
                         <span className="font-bold text-slate-500">{String.fromCharCode(97 + i)}.</span> 
                         <span>{opt}</span>
                         {isSubmitted && opt === q.answer && <Icon icon="check" className="w-5 h-5 ml-auto text-green-600"/>}
                         {isSubmitted && selectedAnswers[index] === opt && opt !== q.answer && <Icon icon="x" className="w-5 h-5 ml-auto text-red-600"/>}
                      </button>
                    ))}
                  </div>
                )}
                
                {q.type !== QuizType.MCQ && (
                    <div className="mt-3 bg-slate-100 border border-slate-200 text-slate-800 p-3 rounded-lg">
                        <p><span className="font-bold">Answer:</span> {q.answer}</p>
                    </div>
                )}

                {isSubmitted && q.type === QuizType.MCQ && selectedAnswers[index] !== q.answer && (
                    <div className="mt-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-start gap-2">
                        <Icon icon="check" className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                        <p><span className="font-bold">Correct Answer:</span> {q.answer}</p>
                    </div>
                )}
              </li>
            ))}
            </ul>

            {!isSubmitted && quiz.length > 0 && quiz[0].type === QuizType.MCQ && (
                <button
                    onClick={handleSubmit}
                    className="w-full flex justify-center items-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all"
                >
                    Submit Quiz
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default QuizView;