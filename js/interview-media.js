/**
 * Interview Media Handler
 * Manages Webcam feed and Speech Recognition
 */

class InterviewMedia {
    constructor() {
        this.videoElement = null;
        this.stream = null;
        this.recognition = null;
        this.isRecording = false;
        this.onResult = null; // Callback for text result
    }

    // Initialize Webcam
    async initCamera(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        if (!this.videoElement) return false;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            this.videoElement.srcObject = this.stream;
            return true;
        } catch (err) {
            console.error("Error accessing webcam:", err);
            // Handle permission denied or no camera
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    // Initialize Speech Recognition
    initSpeech(onResultCallback) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech Recognition not supported in this browser.");
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.onResult = onResultCallback;

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (this.onResult) {
                this.onResult(finalTranscript, interimTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
        };

        return true;
    }

    startListening() {
        if (this.recognition && !this.isRecording) {
            this.recognition.start();
            this.isRecording = true;
            return true;
        }
        return false;
    }

    stopListening() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        }
    }

    toggleListening() {
        if (this.isRecording) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isRecording;
    }
}

// Export global instance
window.interviewMedia = new InterviewMedia();
