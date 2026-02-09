/**
 * Gemini AI Service
 * Handles AI-powered resume analysis, interview questions, and feedback
 */

const GeminiService = {
    apiKeys: [],
    currentKeyIndex: 0,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',

    /**
     * Initialize the service with API keys
     */
    init(apiKey) {
        // Collect all available Gemini keys from environment
        const keys = [];
        if (apiKey) keys.push(apiKey);

        // Check for indexed keys (VITE_GEMINI_API_KEY_1 to 4)
        for (let i = 1; i <= 4; i++) {
            const key = window.ENV?.[`VITE_GEMINI_API_KEY_${i}`];
            if (key && !key.includes('YOUR_GEMINI_API_KEY')) {
                keys.push(key);
            }
        }

        // Fallback to legacy single key if no indexed keys found
        if (keys.length === 0 && window.ENV?.VITE_GEMINI_API_KEY) {
            keys.push(window.ENV.VITE_GEMINI_API_KEY);
        }

        this.apiKeys = [...new Set(keys)]; // Unique keys
        this.currentKeyIndex = 0;

        if (this.apiKeys.length > 0) {
            console.log(`[GeminiService] ✅ Initialized with ${this.apiKeys.length} API key(s)`);
        } else {
            console.warn('[GeminiService] ⚠️ No API keys found. Using demo data.');
        }
    },

    /**
     * Check if service is available
     */
    isAvailable() {
        return !!this.apiKey;
    },

    /**
     * Make API request to Gemini with optional file data and retry/rotation logic
     */
    async _request(prompt, fileData = null, retries = 3, delay = 1000) {
        if (this.apiKeys.length === 0) {
            throw new Error('Gemini API keys not configured');
        }

        const currentApiKey = this.apiKeys[this.currentKeyIndex];

        try {
            // Build parts array
            const parts = [];

            // Add file data if provided (for PDF analysis)
            if (fileData) {
                parts.push({
                    inline_data: {
                        mime_type: fileData.mimeType,
                        data: fileData.base64
                    }
                });
            }

            // Add text prompt
            parts.push({ text: prompt });

            const response = await fetch(`${this.baseUrl}?key=${currentApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();

                // Handle rate limits with Key Rotation 🔄
                if (response.status === 429) {
                    if (this.apiKeys.length > 1) {
                        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
                        console.warn(`[GeminiService] 🔄 Rate limit hit on Key ${currentApiKey.substring(0, 8)}... Switching to index ${this.currentKeyIndex}`);
                        // Retry immediately with new key
                        return this._request(prompt, fileData, retries, delay);
                    } else if (retries > 0) {
                        console.warn(`[GeminiService] ⏳ Rate limit hit. Retrying in ${delay / 1000}s... (${retries} retries left)`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this._request(prompt, fileData, retries - 1, delay * 2);
                    }
                    throw new Error('AI Rate Limit Exceeded (429). All API keys are currently limited.');
                }

                throw new Error(error.error?.message || 'Gemini API request failed');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return text;
        } catch (error) {
            // Handle network errors or rate limit strings
            if (error.message.includes('Resource has been exhausted') || error.message.includes('429')) {
                if (this.apiKeys.length > 1) {
                    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
                    console.warn(`[GeminiService] 🔄 Retrying with next key after error...`);
                    return this._request(prompt, fileData, retries, delay);
                }
            }

            if (error.message.includes('Rate Limit') && retries > 0) {
                console.warn(`[GeminiService] ⏳ Network error/Rate limit. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this._request(prompt, fileData, retries - 1, delay * 2);
            }
            console.error('[GeminiService] ❌ API Error:', error);
            throw error;
        }
    },

    /**
     * Parse JSON from Gemini response (handles markdown code blocks and partial structures)
     */
    _parseJSON(text) {
        try {
            let cleaned = text.trim();
            // Remove markdown code blocks
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim();

            const parsed = JSON.parse(cleaned);

            // If it's an array (like for questions), return it directly
            if (Array.isArray(parsed)) return parsed;

            // If it's an object, ensure it's not null and has minimum fields for safety
            if (parsed && typeof parsed === 'object') {
                // If it looks like a resume analysis, add defaults
                if (parsed.skills || parsed.score) {
                    return {
                        skills: {
                            present: Array.isArray(parsed.skills?.present) ? parsed.skills.present : [],
                            partial: Array.isArray(parsed.skills?.partial) ? parsed.skills.partial : [],
                            missing: Array.isArray(parsed.skills?.missing) ? parsed.skills.missing : []
                        },
                        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
                        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
                        score: typeof parsed.score === 'number' ? parsed.score : 0,
                        coverage: typeof parsed.coverage === 'number' ? parsed.coverage : 0,
                        readiness: typeof parsed.readiness === 'number' ? parsed.readiness : 0,
                        ...parsed
                    };
                }
                return parsed;
            }
            return null;
        } catch (e) {
            console.error('[GeminiService] Failed to parse JSON:', e, 'Text:', text);
            return null;
        }
    },

    /**
     * Convert File to base64
     */
    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Analyze PDF file directly using Gemini's multimodal capability
     */
    async analyzePDF(file, targetRole = 'sde') {
        console.log('[GeminiService] 📄 Analyzing PDF:', file.name);

        const base64 = await this._fileToBase64(file);

        const prompt = `You are an expert resume analyzer. Analyze this PDF resume for a ${targetRole} role.

Respond with ONLY a JSON object (no markdown):
{
    "skills": {
        "present": ["skill1", "skill2"],
        "partial": ["skill3"],
        "missing": ["skill4", "skill5"]
    },
    "experience": [
        {"title": "Job Title", "company": "Company", "duration": "X years"}
    ],
    "projects": [
        {"name": "Project Name", "tech": "Technologies"}
    ],
    "score": 75,
    "coverage": 65,
    "readiness": 60,
    "atsScore": {
        "overall": 72,
        "keyword": 68,
        "experience": 75,
        "format": 80,
        "suggestions": ["suggestion1", "suggestion2"]
    }
}`;

        try {
            const response = await this._request(prompt, {
                mimeType: 'application/pdf',
                base64: base64
            });
            const parsed = this._parseJSON(response);

            if (parsed) {
                console.log('[GeminiService] ✅ PDF analysis complete');
                return parsed;
            } else {
                throw new Error('Failed to parse AI response');
            }
        } catch (error) {
            console.error('[GeminiService] ❌ PDF analysis failed:', error);
            throw error;
        }
    },

    /**
     * Analyze resume text
     */
    async analyzeResume(resumeText, targetRole = 'sde') {
        console.log('[GeminiService] 🔍 Analyzing resume text');

        const prompt = `You are an expert resume analyzer. Analyze this resume for a ${targetRole} role.

Resume Text:
${resumeText}

Respond with ONLY a JSON object (no markdown):
{
    "skills": {
        "present": ["skill1", "skill2"],
        "partial": ["skill3"],
        "missing": ["skill4", "skill5"]
    },
    "experience": [
        {"title": "Job Title", "company": "Company", "duration": "X years"}
    ],
    "projects": [
        {"name": "Project Name", "tech": "Technologies"}
    ],
    "score": 75,
    "coverage": 65,
    "readiness": 60,
    "atsScore": {
        "overall": 72,
        "keyword": 68,
        "experience": 75,
        "format": 80,
        "suggestions": ["suggestion1", "suggestion2"]
    }
}`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed) {
                console.log('[GeminiService] ✅ Resume analysis complete');
                return parsed;
            }
            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('[GeminiService] ❌ Resume analysis failed:', error);
            throw error;
        }
    },

    /**
     * Generate interview questions
     */
    async generateQuestions(skills, role = 'sde', type = 'mixed', count = 8) {
        console.log('[GeminiService] 📝 Generating questions');

        const skillList = Array.isArray(skills) ? skills.join(', ') : skills;

        const prompt = `Generate ${count} interview questions for a ${role} position.

Candidate's Skills: ${skillList}
Type: ${type}

Respond with ONLY a JSON array (no markdown):
[
    {
        "type": "code",
        "category": "Data Structures",
        "text": "Write a function to reverse a linked list.",
        "difficulty": "medium",
        "timeLimit": 300,
        "tips": ["Consider edge cases like empty list", "Discuss time vs space complexity", "Try both iterative and recursive approaches"]
    },
    {
        "type": "text",
        "category": "Behavioral",
        "text": "Tell me about a challenging project.",
        "difficulty": "easy",
        "timeLimit": 120,
        "tips": ["Use the STAR method", "Focus on your specific actions", "Highlight the positive outcome"]
    }
]`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed && Array.isArray(parsed)) {
                console.log(`[GeminiService] ✅ Generated ${parsed.length} questions`);
                return parsed;
            }
            throw new Error('Failed to parse questions');
        } catch (error) {
            console.error('[GeminiService] ❌ Question generation failed:', error);
            throw error;
        }
    },

    /**
     * Evaluate an interview answer
     */
    async evaluateAnswer(question, answer) {
        console.log('[GeminiService] 📊 Evaluating answer');

        const prompt = `Evaluate this interview answer.

Question: ${question.text}
Category: ${question.category}

Answer: ${answer}

Evaluate this interview answer based on intended problem logic, approach, and reasoning.
Question: ${question.text} (${question.category})
Answer: ${answer}

Respond with ONLY a JSON object:
{
    "outcome": "Correct Answer" | "Incorrect Answer",
    "score": 0-100,
    "feedback": "Concise feedback on accuracy",
    "reasoning": "Brief analysis of the user's logic and approach",
    "strengths": ["..."],
    "improvements": ["..."]
}`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed) {
                console.log('[GeminiService] ✅ Answer evaluated:', parsed.score);
                return parsed;
            }
            throw new Error('Failed to parse evaluation');
        } catch (error) {
            console.error('[GeminiService] ❌ Evaluation failed:', error);
            throw error;
        }
    },

    /**
     * Simulate code execution against multiple test cases
     */
    async executeCode(code, language, testCases) {
        console.log(`[GeminiService] ⚙️ Executing ${language} code against ${testCases.length} tests`);

        const testsJson = JSON.stringify(testCases);
        const prompt = `You are a highly accurate code execution engine and compiler for ${language}.
Your task is to execute the provided code against multiple test cases and return the results.

CODE:
${code}

LANGUAGE: ${language}

TEST CASES:
${testsJson}

For each test case, determine the expected output vs actual output of the code.
Consider standard rules for ${language} (syntax, logic, common libraries).

Respond with ONLY a JSON array of results:
[
    {
        "label": "Test Case Label",
        "input": "Input provided",
        "expected": "Expected output",
        "actual": "What the code actually produced",
        "status": "passed" | "failed",
        "output": "Any console output or error messages if applicable"
    }
]

IMPORTANT: 
- Be precise. If the code is correct, marks as "passed".
- If there's a syntax error, provide it in the "output" field and mark all as "failed".
- Return ONLY the JSON array.`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed && Array.isArray(parsed)) {
                console.log('[GeminiService] ✅ Code execution simulation complete');
                return parsed;
            }
            throw new Error('Failed to parse execution results');
        } catch (error) {
            console.error('[GeminiService] ❌ Execution simulation failed:', error);
            throw error;
        }
    },

    async analyzeMarketSkills(role, marketSearchData, userSkills) {
        console.log('[GeminiService] 🔍 Categorizing market skills');

        const prompt = `You are a career expert. Analyze these market search results for the role "${role}" and compare them with the user's current skills.
Market Trends context:
${JSON.stringify(marketSearchData)}

User's current skills (from resume):
${JSON.stringify(userSkills)}

Task: Identify the top 12 most relevant skills for this role and categorize them.
Status categorization rules:
- "present": User has this skill clearly on their resume.
- "partial": User has related skills but might lack specific depth or tool knowledge.
- "missing": Skill is mentioned in market trends but not found in user skills.

Respond with ONLY a JSON object:
{
    "mustHave": [
        { "name": "Skill Name", "status": "present"|"partial"|"missing", "priority": "Critical"|"Essential", "desc": "Short market relevance justification" }
    ],
    "goodToHave": [
        { "name": "Skill Name", "status": "present"|"partial"|"missing", "priority": "High"|"Medium", "desc": "Short market relevance justification" }
    ],
    "futureProof": [
        { "name": "Skill Name", "status": "present"|"partial"|"missing", "priority": "Growing"|"Emerging", "desc": "Short market relevance justification" }
    ]
}`;

        try {
            const response = await this._request(prompt);
            const parsed = this._parseJSON(response);
            if (parsed) {
                console.log('[GeminiService] ✅ Market skills analyzed');
                return parsed;
            }
            throw new Error('Failed to parse market analysis');
        } catch (error) {
            console.warn('[GeminiService] ⚠️ Market analysis failed, using fallback:', error.message);
            return this._getFallbackMarketSkills(role, userSkills);
        }
    },

    /**
     * Provides high-quality static fallback when AI analysis fails
     */
    _getFallbackMarketSkills(role, userSkills) {
        // Ensure userSkills is an array to avoid .map error
        const skillsArray = Array.isArray(userSkills) ? userSkills : [];
        const userSkillSet = new Set(skillsArray.map(s => (typeof s === 'string' ? s : s.name).toLowerCase()));

        const checkStatus = (skill) => {
            const lowerSkill = skill.toLowerCase();
            if (userSkillSet.has(lowerSkill)) return 'present';
            // Simple partial check
            for (const s of userSkillSet) {
                if (s.includes(lowerSkill) || lowerSkill.includes(s)) return 'partial';
            }
            return 'missing';
        };

        const roleLower = role.toLowerCase();

        // Comprehensive fallback data
        const data = {
            mustHave: [
                { name: 'Core Language Proficiency', priority: 'Critical', desc: 'Deep knowledge of primary language required for the role' },
                { name: 'Data Structures & Algorithms', priority: 'Critical', desc: 'Essential for technical problem solving and performance' },
                { name: 'Version Control (Git)', priority: 'Essential', desc: 'Standard for team collaboration and code management' },
                { name: 'System Design Basics', priority: 'Essential', desc: 'Understanding of how software components interact' }
            ],
            goodToHave: [
                { name: 'Cloud Services (AWS/Azure)', priority: 'High', desc: 'Modern deployment and infrastructure knowledge' },
                { name: 'Docker & Containerization', priority: 'High', desc: 'Standard for reproducible environments' },
                { name: 'Unit Testing & Quality', priority: 'Medium', desc: 'Ensures code reliability and maintainability' },
                { name: 'API Design (REST/GraphQL)', priority: 'Medium', desc: 'Communication between distributed systems' }
            ],
            futureProof: [
                { name: 'AI/ML Integration', priority: 'Growing', desc: 'Ability to leverage AI models in applications' },
                { name: 'Microservices Architecture', priority: 'Growing', desc: 'Scaling applications for high availability' },
                { name: 'Prompts Engineering', priority: 'Emerging', desc: 'Effectively working with LLMs' },
                { name: 'Edge Computing', priority: 'Emerging', desc: 'Reducing latency for real-time applications' }
            ]
        };

        // Customizations for specific roles
        if (roleLower.includes('frontend') || roleLower.includes('ui')) {
            data.mustHave[0].name = 'Modern JS Frameworks (React/Vue)';
            data.goodToHave[3].name = 'TypeScript & State Management';
        } else if (roleLower.includes('backend')) {
            data.mustHave[0].name = 'Server-side Logic & DBs';
            data.goodToHave[0].name = 'Distributed Systems';
        }

        // Apply dynamic status based on user resume
        const applyStatus = (category) => {
            category.forEach(s => { s.status = checkStatus(s.name); });
        };

        applyStatus(data.mustHave);
        applyStatus(data.goodToHave);
        applyStatus(data.futureProof);

        return data;
    }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    GeminiService.init();
});

window.GeminiService = GeminiService;
