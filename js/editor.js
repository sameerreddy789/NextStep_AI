/**
 * editor.js
 * Manages Monaco Editor integration, code persistence, and execution.
 */

// Editor State
const EditorState = {
    editor: null,
    currentLanguage: 'javascript',
    languages: {
        'javascript': { id: 'javascript', label: 'JavaScript', defaultCode: '// Write your JavaScript code here\nconsole.log("Hello World!");\n' },
        'python': { id: 'python', label: 'Python', defaultCode: '# Write your Python code here\nprint("Hello World!")\n' },
        'java': { id: 'java', label: 'Java', defaultCode: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}\n' }
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
        value: getSavedCode() || EditorState.languages.javascript.defaultCode,
        language: 'javascript',
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

    EditorState.currentLanguage = langId;
    const model = EditorState.editor.getModel();
    monaco.editor.setModelLanguage(model, langId);

    // Update code if empty or default
    const currentCode = EditorState.editor.getValue();
    if (!currentCode || currentCode === EditorState.languages['javascript'].defaultCode) {
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
    await new Promise(r => setTimeout(r, 800));

    let output = '';

    try {
        if (EditorState.currentLanguage === 'javascript') {
            // Unsafe eval for demo purposes ONLY
            // In production, send to backend sandbox
            let logs = [];
            const originalLog = console.log;
            console.log = (...args) => logs.push(args.join(' '));

            try {
                // Wrap in closure
                new Function(code)();
                output = logs.join('\n');
                if (!output) output = '<span style="color: #9ca3af">// Code ran successfully (no output)</span>';
            } catch (e) {
                output = `<span style="color: #ef4444">Error: ${e.message}</span>`;
            } finally {
                console.log = originalLog;
            }
        } else {
            output = `<span style="color: #fbbf24"> Note: ${EditorState.languages[EditorState.currentLanguage].label} execution is mocked.</span>\n\n> Hello World!`;
        }
    } catch (e) {
        output = `<span style="color: #ef4444">Error: ${e.message}</span>`;
    }

    if (outputContainer) {
        outputContainer.innerHTML = output;
    }
}

// Export functions globally
window.EditorManager = {
    init: initEditor,
    setLanguage: setLanguage,
    run: runCode,
    getValue: () => EditorState.editor ? EditorState.editor.getValue() : ''
};
