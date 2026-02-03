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
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.onResult = null; // Callback for text result
        this.synth = window.speechSynthesis;
    }

    // Initialize Webcam with Audio
    async initCamera(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        if (!this.videoElement) return false;

        try {
            console.log("Requesting camera access...");
            // Request both video and audio
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });

            this.videoElement.srcObject = this.stream;
            console.log("Camera access granted.");
            return true;
        } catch (err) {
            console.error("Error accessing webcam:", err);
            let msg = "Could not access camera.";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                msg = "Camera/Mic permission denied. Please allow access in your browser settings (look for the icon in the address bar).";
            } else if (err.name === 'NotFoundError') {
                msg = "No camera or microphone found on this device.";
            } else if (err.name === 'NotReadableError') {
                msg = "Camera is currently in use by another application.";
            }
            alert(msg);
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.cancelSpeech();
    }

    // Video Recording
    startVideoRecording() {
        if (this.stream && MediaRecorder.isTypeSupported('video/webm')) {
            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'video/webm' });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            console.log("Video recording started");
            return true;
        }
        return false;
    }

    stopVideoRecording() {
        return new Promise((resolve) => {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.onstop = () => {
                    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    resolve(url);
                };
                this.mediaRecorder.stop();
                console.log("Video recording stopped");
            } else {
                resolve(null);
            }
        });
    }

    // Text to Speech
    speak(text, onStart, onEnd) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.onstart = () => {
            if (onStart) onStart();
        }
        utterThis.onend = () => {
            if (onEnd) onEnd();
        }

        // Select a good voice (optional)
        const voices = this.synth.getVoices();
        // Try to find a natural sounding English voice
        const preferredVoice = voices.find(voice => voice.name.includes("Google US English")) ||
            voices.find(voice => voice.name.includes("Samantha")) ||
            voices.find(voice => voice.lang === 'en-US');

        if (preferredVoice) {
            utterThis.voice = preferredVoice;
        }

        utterThis.pitch = 1;
        utterThis.rate = 1;
        this.synth.speak(utterThis);
    }

    cancelSpeech() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    // Initialize Speech Recognition
    initSpeech(onResultCallback) {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech Recognition not supported in this browser.");
            alert("Note: Speech-to-Text is not supported in this browser. Please use Chrome or Edge for the best experience.");
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
            // Ignore no-speech error as it happens often
            if (event.error !== 'no-speech') {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    alert("Microphone access blocked for speech recognition. Please check your tracking protection or permission settings.");
                }
            }
        };

        this.recognition.onend = () => {
            this.isRecording = false;
        };

        return true;
    }

    startListening() {
        if (this.recognition && !this.isRecording) {
            try {
                this.recognition.start();
                this.isRecording = true;
                return true;
            } catch (e) {
                console.error("Start listening error:", e);
                return false;
            }
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
        if (!this.recognition) {
            alert("Speech recognition is not initialized or supported.");
            return false;
        }

        if (this.isRecording) {
            this.stopListening();
            return false; // Stopped
        } else {
            const started = this.startListening();
            if (started) return true; // Started
            return false; // Failed to start
        }
    }
}

// Export global instance
window.interviewMedia = new InterviewMedia();
