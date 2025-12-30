import OpenAI from "openai";
import { StudyData, QuestionMode, QuizQuestion, TheoryQuestion, Formula, GeneratorParams, QuizConfig, InteractiveQuestion } from "../types";
import { jsonrepair } from "jsonrepair";

const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";
console.log("DEBUG: API Key Status:", apiKey ? `Present (Length: ${apiKey.length})` : "MISSING");
console.log("DEBUG: Model:", process.env.OPENROUTER_MODEL || "Defaulting");

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "X-Title": "Crazu Study Companion",
  }
});

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "llama-3.3-70b-versatile";

// --- HELPERS ---

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    console.warn(`API call failed. Retrying in ${delay}ms... (Attempts left: ${retries})`, error.message);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

const safeParseJSON = (text: string): any => {
  if (!text) return {};
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose > firstOpen) {
      cleaned = cleaned.substring(firstOpen, lastClose + 1);
  } else if (firstOpen !== -1) {
      cleaned = cleaned.substring(firstOpen);
  } else {
      return {};
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (e2) {
       try {
           let patched = cleaned.replace(/\\([^\\])/g, '\\$1'); 
           const repairedPatched = jsonrepair(patched);
           return JSON.parse(repairedPatched);
       } catch (e3) {
           console.error("JSON Parsing failed completely.");
           return {};
       }
    }
  }
};

const formatMessage = (text: string, data?: string, mimeType?: string) => {
  if (!data) {
    return [{ role: "user", content: text }];
  }
  
  if (mimeType === 'text/plain') {
     return [{ role: "user", content: `${text}\n\n--- DOCUMENT CONTENT ---\n${data}` }];
  }
  
  return [
    {
      role: "user",
      content: [
        { type: "text", text: text },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${data}`
          }
        }
      ]
    }
  ];
};

// --- EXPORTS ---

export const processDocument = async (data: string, mimeType: string = 'application/pdf'): Promise<StudyData> => {
  try {
    // 1. ANALYSIS REQUEST (JEE Focused)
    const analysisPromise = withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system", 
          content: `You are a senior faculty member at a top Kota coaching institute for JEE/NEET.
          **Task**: Create a high-yield study guide for competitive exams.
          **Focus**: 
          - Identify concepts frequently asked in JEE Mains/Advanced or NEET.
          - Highlight "Tricks" and "Common Pitfalls".
          **Format**: JSON
          {
            "reasoning": "Explain pedagogical choices.",
            "analysis": "Markdown content. Use '## High Weightage Topics', '## Shortcut Methods'. Use LaTeX ($).",
            "keyTopics": ["topic1", "topic2"]
          }` 
        },
        ...formatMessage("Analyze this document for entrance exam relevance.", data, mimeType) as any
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    }));

    // 2. EXAM SIMULATOR REQUEST (Hard)
    const quizPromise = withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system", 
          content: `You are a strict JEE/NEET paper setter.
          **Task**: Generate 15 Questions.
          **Requirements**:
          - **5 MCQs (Single Correct)**: Conceptual, tricky distractors.
          - **5 Numerical Value Type (for JEE) OR Assertion-Reasoning (for NEET)**: Depends on context.
          - **5 Statement Based**: Multi-statement True/False.
          - Difficulty: Moderate to Hard.
          - Use LaTeX ($).
          
          Return JSON:
          {
            "quiz": [{"id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Detailed solution."}],
            "theoryQuestions": [{"question": "...", "answer": "Final Answer", "explanation": "Step-by-step derivation."}]
          }` 
        },
        ...formatMessage("Create a competitive mock test.", data, mimeType) as any
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    }));

    // 3. VISUALS (Mnemonics)
    const visualsPromise = withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system", 
          content: `You are a visual learning expert.
          1. **Flashcards**: Create 20 cards focusing on "Formula Applications", "Reaction Mechanisms", or "Biology Examples".
          2. **MindMap**: Hierarchical breakdown of the chapter.
          
          Return JSON:
          {
            "flashcards": [{"id": 1, "term": "...", "definition": "..."}],
            "mindMap": {"label": "Chapter", "children": []}
          }` 
        },
        ...formatMessage("Create memory aids.", data, mimeType) as any
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    }));

    // 4. FORMULAS (Exhaustive)
    const formulasPromise = withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system", 
          content: `Create a "Formula Sheet" for last-minute revision.
          - Include EVERY formula, constant, and reaction.
          - Group by sub-topic.
          - Use LaTeX ($).
          
          Return JSON:
          {
            "formulas": [{"title": "...", "expression": "$...$", "method": "Usage tip", "section": "Sub-topic"}]
          }` 
        },
        ...formatMessage("Extract formulas.", data, mimeType) as any
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    }));

    const [analysisRes, quizRes, visualsRes, formulasRes] = await Promise.all([
        analysisPromise, 
        quizPromise, 
        visualsPromise, 
        formulasPromise
    ]);

    const analysisJson = safeParseJSON(analysisRes.choices[0].message?.content || "{}");
    const quizJson = safeParseJSON(quizRes.choices[0].message?.content || "{}");
    const visualsJson = safeParseJSON(visualsRes.choices[0].message?.content || "{}");
    const formulasJson = safeParseJSON(formulasRes.choices[0].message?.content || "{}");

    return {
      paperId: Math.random().toString(36).substring(7),
      analysis: analysisJson.analysis || "Analysis generation failed.",
      keyTopics: analysisJson.keyTopics || [],
      formulas: formulasJson.formulas || [],
      quiz: quizJson.quiz || [],
      theoryQuestions: quizJson.theoryQuestions || [],
      flashcards: visualsJson.flashcards || [],
      mindMap: visualsJson.mindMap || { label: "Root", children: [] }
    };

  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
};

export const getCurriculumTopics = async (grade: string, board: string, subject: string): Promise<string[]> => {
  try {
    const response = await withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system", 
          content: `Return a JSON object with a 'topics' array containing the 10 most important chapters for the given context (JEE/NEET Syllabus). Prioritize High Weightage chapters.` 
        },
        { role: "user", content: `Grade: ${grade}, Target: ${board}, Subject: ${subject}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    }));

    const json = safeParseJSON(response.choices[0].message?.content || "{}");
    
    // Safety: Ensure topics is a string array even if LLM returns objects
    const rawTopics = json.topics || [];
    return rawTopics.map((t: any) => {
        if (typeof t === 'string') return t;
        if (typeof t === 'object' && t.chapter) return `${t.chapter} (${t.weightage || 'High'}%)`;
        if (typeof t === 'object' && t.topic) return t.topic;
        return JSON.stringify(t);
    });
  } catch (error) {
    console.error("Error getting topics:", error);
    return [];
  }
};

export const generateTestPaper = async (params: GeneratorParams): Promise<{quiz: QuizQuestion[], theoryQuestions: TheoryQuestion[]}> => {
  try {
    const isPYQ = params.sourceType === 'NON_AI';
    
    const systemPrompt = isPYQ 
        ? `You are a JEE/NEET Archivist.
           **Task**: Retrieve REAL, VERBATIM Past Year Questions (PYQs).
           **Rules**:
           1. Output ONLY questions that actually appeared in ${params.board} exams (2010-2024).
           2. **Cite the Year**: Start every question with the tag [Year] (e.g., "[JEE Main 2019] A ball is...").
           3. Do NOT invent or simulate questions. If exact text is unavailable, recall the specific concept tested in a specific year.
           4. Use LaTeX ($) for math.`
        : `You are a strict JEE/NEET paper setter.
           **Task**: Create high-quality original questions.
           **Rules**:
           1. Create 15 MCQs strictly following ${params.board} pattern.
           2. Include tricky calculation-based questions for Physics/Chem.
           3. Include Assertion-Reasoning for Biology/Chem.
           4. Ensure all options in MCQs are plausible distractors.`;

    const userPrompt = `Topic: ${params.topic}. Target: ${params.board} (Class ${params.grade}). Difficulty: ${params.difficulty}.
    Requirements:
    - ${params.mcqCount} MCQs.
    - ${params.theoryCount} Theory/Subjective Questions.
    
    Return ONLY valid JSON:
    {
      "quiz": [{"id": 1, "question": "...", "options": ["...", "..."], "correctIndex": 0, "explanation": "Detailed solution."}],
      "theoryQuestions": [{"question": "...", "answer": "...", "explanation": "..."}]
    }`;

    const response = await withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: isPYQ ? 0.1 : 0.5, // Low temp for PYQ (Memory), Medium for Creative
    }));

    const json = safeParseJSON(response.choices[0].message?.content || "{}");
    return {
        quiz: json.quiz || [],
        theoryQuestions: json.theoryQuestions || []
    };
  } catch (error) {
    console.error("Error generating test paper:", error);
    return { quiz: [], theoryQuestions: [] };
  }
};
export const generateFormulaSheet = async (grade: string, subject: string, topic: string): Promise<Formula[]> => {
    try {
        const response = await withRetry(() => client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: "system",
                    content: `You are a top JEE/NEET faculty creating a Formula Cheat Sheet.
                    
                    **Task**: Create a COMPLETE, EXHAUSTIVE Formula Cheat Sheet.
                    **Rules**:
                    1.  **Exhaustive**: Include every formula, constant, and shortcut.
                    2.  **Shortcuts**: Include "Kota Tricks" or special cases.
                    3.  **Grouping**: Group logically (e.g., "Definitions", "Laws", "Derivations", "Tricks").
                    4.  **Format**: JSON Use LaTeX ($).
                    
                    Return JSON:
                    {
                        "formulas": [
                            {"title": "Name", "expression": "$LaTeX$", "method": "Usage tip", "section": "Subtopic"}
                        ]
                    }`
                },
                { role: "user", content: `Formula sheet for: Class ${grade}, Subject ${subject}, Topic ${topic}.` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        }));
        const json = safeParseJSON(response.choices[0].message?.content || "{}");
        return json.formulas || [];
    } catch (error) {
        console.error("Formula generation failed", error);
        return [];
    }
};

export const generateDiagramForQuestion = async (question: string): Promise<string | null> => {
    try {
        const response = await withRetry(() => client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: "Generate a valid SVG code string. Simple, black strokes, white fill." },
                { role: "user", content: `Question: "${question}"` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        }));
        const json = safeParseJSON(response.choices[0].message?.content || "{}");
        return json.diagramSVG || null;
    } catch (error) {
        return null;
    }
}

export const generateMoreQuestions = async (data: string, mimeType: string, mode: QuestionMode, existingCount: number, count: number = 5): Promise<{quiz?: QuizQuestion[], theoryQuestions?: TheoryQuestion[]}> => {
  try {
    const promptText = `Generate ${count} MORE distinct ${mode === QuestionMode.MCQ ? 'JEE/NEET Level MCQs' : 'Hard Conceptual Questions'}. Start IDs from ${existingCount + 1}. Return JSON.`;
    const response = await withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are an assistant generating additional study questions in JSON format." },
        ...formatMessage(promptText, data, mimeType) as any
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }));
    return safeParseJSON(response.choices[0].message?.content || "{}");
  } catch (error) {
    console.error("Error generating more questions:", error);
    throw error;
  }
};

export const generateMoreFormulas = async (data: string, mimeType: string): Promise<{formulas: Formula[]}> => {
    try {
      const response = await withRetry(() => client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "Extract 5 more unique formulas in JSON format." },
          ...formatMessage("Extract more formulas.", data, mimeType) as any
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }));
      return safeParseJSON(response.choices[0].message?.content || "{}");
    } catch (error) {
      console.error("Error generating more formulas:", error);
      throw error;
    }
};

export const askDocumentQuestion = async (data: string, mimeType: string, question: string): Promise<string> => {
  try {
    const response = await withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "Answer questions based on the document. Use Markdown and LaTeX." },
        ...formatMessage(question, data, mimeType) as any
      ],
      temperature: 0.1,
    }));
    return response.choices[0].message?.content || "No response generated.";
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
};

export const generateCustomQuiz = async (data: string, mimeType: string, config: QuizConfig): Promise<InteractiveQuestion[]> => {
  try {
    const response = await withRetry(() => client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system", 
          content: `Create a custom quiz. Return JSON: {"questions": [...]}. Types: ${config.types.join(', ')}. Difficulty: ${config.difficulty}.` 
        },
        ...formatMessage(`Generate ${config.count} questions.`, data, mimeType) as any
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }));
    const json = safeParseJSON(response.choices[0].message?.content || "{}");
    return json.questions || [];
  } catch (error) {
    console.error("Error generating custom quiz:", error);
    throw error;
  }
};

export const processPdf = processDocument;
export const generateCurriculumStudyMaterial = async (params: GeneratorParams): Promise<StudyData> => {
  return processDocument(`Mock Context: ${JSON.stringify(params)}`, 'text/plain');
};
