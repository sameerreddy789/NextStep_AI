/**
 * editor.js
 * Manages Monaco Editor integration, code persistence, and execution.
 */

// Editor State
const EditorState = {
    editor: null,
    currentLanguage: 'c',
    languages: {
        'c': { id: 'c', label: 'C', defaultCode: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    printf("Hello World");\n    return 0;\n}' },
        'cpp': { id: 'cpp', label: 'C++', defaultCode: '#include <iostream>\n\nint main() {\n    // Write your solution here\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}' },
        'python': { id: 'python', label: 'Python', defaultCode: '# Write your solution here\ndef solution():\n    print("Hello World!")\n' },
        'java': { id: 'java', label: 'Java', defaultCode: '// Write your solution here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}' },
        'javascript': { id: 'javascript', label: 'JavaScript', defaultCode: '// Write your solution here\nfunction solution() {\n    console.log("Hello World!");\n}\n' }
    }
};

// Initialize Monaco Editor
function initEditor(containerId) {
    if (window.monaco) {
        createEditor(containerId);
        return;
    }

    // Load Monaco via CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
    script.onload = () => {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            createEditor(containerId);
        });
    };
    document.body.appendChild(script);
}

function createEditor(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear loading state if any
    container.innerHTML = '';

    // Create Editor
    EditorState.editor = monaco.editor.create(container, {
        value: getSavedCode() || EditorState.languages.c.defaultCode,
        language: 'c',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
        scrollBeyondLastLine: false,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        cursorBlinking: 'smooth'
    });

    // Auto-save on change
    EditorState.editor.onDidChangeModelContent(() => {
        saveCode();
    });

    // Expose editor to window for debugging or external control
    window.MonacoEditor = EditorState.editor;

    console.log('Monaco Editor Initialized');
}

// Language Switching
function setLanguage(langId) {
    if (!EditorState.languages[langId]) return;
    if (!EditorState.editor) {
        console.warn('[Editor] Can\'t set language yet: Editor not initialized');
        EditorState.currentLanguage = langId; // Store anyway so we can use it when it loads
        return;
    }

    EditorState.currentLanguage = langId;
    const model = EditorState.editor.getModel();
    if (!model) return;

    monaco.editor.setModelLanguage(model, langId);

    // Dynamic Boilerplate Logic
    const currentCode = EditorState.editor.getValue().trim();

    // Check if the current code is empty or matches ANY default boilerplate
    const isDefaultOrEmpty = !currentCode || Object.values(EditorState.languages).some(l => l.defaultCode.trim() === currentCode);

    if (isDefaultOrEmpty) {
        console.log(`[Editor] 📝 Updating boilerplate for ${langId}`);
        EditorState.editor.setValue(EditorState.languages[langId].defaultCode);
    }

    // Update UI Badge
    const badge = document.getElementById('code-lang-badge');
    if (badge) {
        badge.textContent = EditorState.languages[langId].label;
        badge.classList.remove('hidden');
    }
}

// Persistence
function saveCode() {
    if (!EditorState.editor) return;
    const code = EditorState.editor.getValue();
    const qId = getCurrentQuestionId(); // Helper to get current question context
    localStorage.setItem(`editor_code_${qId}`, code);
    localStorage.setItem(`editor_lang_${qId}`, EditorState.currentLanguage);
}

function getSavedCode() {
    const qId = getCurrentQuestionId();
    return localStorage.getItem(`editor_code_${qId}`);
}

function getCurrentQuestionId() {
    // Basic implementation - can be enhanced to use actual question IDs
    return window.currentQuestionIndex || 'default';
}

// Execution (Mock)
async function runCode() {
    if (!EditorState.editor) return;

    const code = EditorState.editor.getValue();
    const outputContainer = document.getElementById('console-output');

    if (outputContainer) {
        outputContainer.innerHTML = '<span style="color: #6b7280">Running...</span>';
    }

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));

    let output = '';
    const lang = EditorState.currentLanguage;

    try {
        if (code.includes('error') || code.includes('bug')) {
            throw new Error('Syntax Error: Unexpected token at line 4');
        }

        // Smarter code analysis
        if (lang === 'java') {
            const printMatches = [...code.matchAll(/System\.out\.println\("([^"]+)"\)/g)];
            if (printMatches.length > 0) {
                const results = printMatches.map(m => m[1]).join('\n');
                output = `Compiling Java source...\nRunning Main.class...\n${results}\n\nBuild Successful`;
            } else if (code.includes('public class')) {
                output = 'Compiling...\nRunning Solution...\nExecution successful.\n\nBuild Successful';
            } else {
                output = 'Compiling Java source...\nExecution complete.\n\nBuild Successful';
            }
        } else if (lang === 'python') {
            const printMatches = [...code.matchAll(/print\(["']([^"']+)["']\)/g)];
            if (printMatches.length > 0) {
                const results = printMatches.map(m => m[1]).join('\n');
                output = `${results}\n>>> `;
            } else {
                output = 'Execution successful.\n>>> ';
            }
        } else if (lang === 'c') {
            const printMatches = [...code.matchAll(/printf\("([^"]+)"/g)];
            if (printMatches.length > 0) {
                const results = printMatches.map(m => m[1].replace(/\\n/g, '\n')).join('');
                output = `Compiling source...\nLinking objects...\n${results}\n\nProcess finished with exit code 0`;
            } else {
                output = 'Compiling source...\nExecution successful.\n\nProcess finished with exit code 0';
            }
        } else {
            output = `Execution successful for ${EditorState.languages[lang]?.label || lang}.\n\nOutput: [Done]`;
        }

    } catch (e) {
        output = `<span style="color: #ef4444">Compilation Error:</span>\n${e.message}`;
    }

    if (outputContainer) {
        const safeOutput = document.createElement('span');
        safeOutput.textContent = output;
        outputContainer.innerHTML = `<pre style="color: #f3f4f6; font-family: 'Fira Code', monospace; margin: 0; white-space: pre-wrap;">${safeOutput.innerHTML}</pre>`;
    }
}

// Export functions globally
window.EditorManager = {
    init: initEditor,
    setLanguage: setLanguage,
    run: runCode,
    toggleTheme: () => {
        if (!EditorState.editor) return;
        const currentTheme = EditorState.editor._themeService._theme.id === 'vs-dark' ? 'vs' : 'vs-dark';
        monaco.editor.setTheme(currentTheme);
        console.log(`Editor theme set to ${currentTheme}`);
    },
    getValue: () => EditorState.editor ? EditorState.editor.getValue() : ''
};
