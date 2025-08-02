import { GoogleGenAI, Chat, GenerateContentResponse, Type, Part } from "@google/genai";
import { SummaryLength, QuizType, QuizQuestion, AppContext, Flashcard } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData,
    },
  };
};

const getSummary = async (context: AppContext, length: SummaryLength): Promise<string> => {
    if (!context) return "Please provide some content to summarize.";
    try {
        const promptPrefix = `You are an expert summarizer. Based on the following content, provide ${length}. Focus on the key points and main ideas.`;
        
        let contents: string | { parts: Part[] };
        if (context.type === 'text') {
            contents = `${promptPrefix} Text: "${context.content}"`;
        } else {
            const filePart = await fileToGenerativePart(context.file);
            contents = { parts: [{ text: promptPrefix }, filePart] };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        return "Sorry, I couldn't generate a summary. Please try again.";
    }
};

const initChat = async (context: AppContext): Promise<Chat | null> => {
    if (!context) return null;

    const systemInstruction = `You are an AI study assistant. Your knowledge is strictly limited to the document provided in the initial history. Answer all subsequent user questions based only on that document. Do not use external knowledge.`;
    
    let history;
    const modelGreeting = { role: 'model' as const, parts: [{ text: "Okay, I have the document. Ask me anything about it." }] };

    if (context.type === 'text') {
        history = [
            { role: 'user' as const, parts: [{ text: `Use the following document for this chat session:\n\n${context.content}` }] },
            modelGreeting
        ];
    } else {
        const filePart = await fileToGenerativePart(context.file);
        history = [
            { role: 'user' as const, parts: [{ text: 'Use the following document for this chat session:' }, filePart] },
            modelGreeting
        ];
    }

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history,
        config: { systemInstruction }
    });
};

const getQuizSchema = (type: QuizType) => {
    const baseProperties = {
        question: { type: Type.STRING, description: 'The question.' },
        answer: { type: Type.STRING, description: 'The correct answer.' },
    };

    if (type === QuizType.MCQ) {
        return {
            type: Type.OBJECT,
            properties: {
                ...baseProperties,
                options: {
                    type: Type.ARRAY,
                    description: 'An array of 4 multiple choice options.',
                    items: { type: Type.STRING },
                },
            },
            required: ['question', 'options', 'answer']
        };
    }
    return { type: Type.OBJECT, properties: baseProperties, required: ['question', 'answer'] };
};

const generateQuiz = async (context: AppContext, type: QuizType, count: number): Promise<QuizQuestion[]> => {
    if (!context) return [];
    
    const jsonPromptPrefix = `Based on the following content, generate a quiz with exactly ${count} ${type} questions.
    - For Multiple-Choice, provide 4 options.
    - For Fill-in-the-Blanks, use "_____" to indicate the blank.
    - For all types, provide the correct answer.`;

    const getContents = async (prefix: string) => {
        if (context.type === 'text') {
            return `${prefix} Text: "${context.content}"`;
        }
        const filePart = await fileToGenerativePart(context.file);
        return { parts: [{ text: prefix }, filePart] };
    };

    try {
        const contents = await getContents(jsonPromptPrefix);
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: `An array of ${count} quiz questions.`,
                    items: getQuizSchema(type),
                },
            },
        });

        const quizData = JSON.parse(response.text);
        return quizData.map((q: any) => ({ ...q, type }));

    } catch (error) {
        console.error("Error generating quiz:", error);
        // Fallback to non-JSON mode if structured output fails
        try {
            const fallbackPromptPrefix = `${jsonPromptPrefix}\n\nReturn the response as a simple text string, not JSON. I will parse it myself.`;
            const fallbackContents = await getContents(fallbackPromptPrefix);
            const fallbackResponse: GenerateContentResponse = await ai.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: fallbackContents
            });
            // This is a simplified parser. A real app might need more robust logic.
            const questions = fallbackResponse.text.split('\n\n').map(qBlock => {
                const lines = qBlock.split('\n');
                const questionLine = lines.find(l => l.startsWith("Question:")) || lines[0];
                const answerLine = lines.find(l => l.startsWith("Answer:")) || "No answer found";
                return {
                    question: questionLine.replace("Question:", "").trim(),
                    answer: answerLine.replace("Answer:", "").trim(),
                    type: QuizType.SHORT_ANSWER, // Default to short answer on fallback
                };
            }).filter(q => q.question);
            if(questions.length > 0) return questions;
        } catch (fallbackError) {
             console.error("Fallback quiz generation failed:", fallbackError);
        }
        
        return [{ question: "Failed to generate quiz questions. The AI might be busy. Please try again later.", answer: "", type }];
    }
};

const generateFlashcards = async (context: AppContext, count: number): Promise<Flashcard[]> => {
    if (!context) return [];
    
    const prompt = `Based on the following content, generate exactly ${count} flashcards. Each flashcard should have a 'term' (a key concept or name) and a 'definition' (a concise explanation of the term).`;

    const getContents = async (prefix: string) => {
        if (context.type === 'text') {
            return `${prefix} Text: "${context.content}"`;
        }
        const filePart = await fileToGenerativePart(context.file);
        return { parts: [{ text: prefix }, filePart] };
    };

    try {
        const contents = await getContents(prompt);
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: `An array of ${count} flashcards, each with a term and a definition.`,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            term: { type: Type.STRING, description: 'The key term or concept for the front of the flashcard.' },
                            definition: { type: Type.STRING, description: 'The definition or explanation for the back of the flashcard.' },
                        },
                        required: ['term', 'definition']
                    },
                },
            },
        });

        return JSON.parse(response.text) as Flashcard[];

    } catch (error) {
        console.error("Error generating flashcards:", error);
        return [{ term: "Error", definition: "Failed to generate flashcards. The AI might be busy. Please try again." }];
    }
};

export const geminiService = {
    getSummary,
    initChat,
    generateQuiz,
    generateFlashcards,
};