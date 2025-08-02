import React, { useState, useCallback, ChangeEvent } from 'react';
import { ActiveTab, AppContext } from './types';
import Icon from './components/Icon';
import StudyView from './components/StudyView';
import ChatView from './components/ChatView';
import QuizView from './components/QuizView';
import FlashcardView from './components/FlashcardView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.STUDY);
  const [context, setContext] = useState<AppContext>(null);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setContext({ type: 'file', file, fileName: file.name });
    }
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  }, []);
  
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      if (text) {
          setContext({ type: 'text', content: text });
      } else {
          setContext(null);
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case ActiveTab.STUDY:
        return <StudyView context={context} />;
      case ActiveTab.CHAT:
        return <ChatView context={context} />;
      case ActiveTab.QUIZ:
        return <QuizView context={context} />;
      case ActiveTab.FLASHCARDS:
        return <FlashcardView context={context} />;
      default:
        return null;
    }
  };
  
  const NavButton: React.FC<{tab: ActiveTab; icon: 'book' | 'chat' | 'quiz' | 'flashcard'; label: string;}> = ({tab, icon, label}) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors ${
        activeTab === tab
            ? 'bg-blue-600 text-white font-semibold shadow-md'
            : 'text-slate-600 hover:bg-slate-200'
        }`}
    >
        <Icon icon={icon} className="w-6 h-6" />
        <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Icon icon="book" className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">AI Study Buddy</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Content Input & Navigation */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4">Your Content</h2>
              
              <div className="space-y-4">
                <textarea
                  value={context?.type === 'text' ? context.content : ''}
                  onChange={handleTextChange}
                  placeholder="Paste your text here..."
                  className="w-full h-48 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-y"
                />

                <div className="flex items-center gap-2 text-slate-500">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span>OR</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="file-upload" className="w-full cursor-pointer bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                        <Icon icon="upload" className="w-5 h-5" />
                        <span>Upload File</span>
                    </label>
                    <input id="file-upload" type="file" accept=".txt,.pdf,.docx,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="hidden" onChange={handleFileChange} />
                    {context?.type === 'file' && <p className="text-sm text-slate-500 truncate">File: {context.fileName}</p>}
                </div>
                
                <div className="relative">
                  <input type="text" placeholder="Enter a URL (coming soon)" disabled className="w-full p-3 pl-10 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed" />
                  <Icon icon="link" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">Tools</h2>
                <nav className="space-y-2">
                    <NavButton tab={ActiveTab.STUDY} icon="book" label="Summarize & Study" />
                    <NavButton tab={ActiveTab.CHAT} icon="chat" label="Contextual Chat" />
                    <NavButton tab={ActiveTab.QUIZ} icon="quiz" label="Generate Quiz" />
                    <NavButton tab={ActiveTab.FLASHCARDS} icon="flashcard" label="Generate Flashcards" />
                </nav>
            </div>
          </aside>

          {/* Right Column: AI Output */}
          <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[60vh]">
             {context ? (
              renderContent()
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <Icon icon="upload" className="w-16 h-16 mx-auto text-slate-300" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-600">Start by Adding Content</h3>
                  <p className="mt-2 text-slate-500">
                    Paste text or upload a file (.txt, .pdf, .docx, etc.) to begin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;