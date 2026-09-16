// @ts-check
/**
 * Interview Timer Module
 * Handles countdown and progress tracking for the interview session.
 */
export class InterviewTimer {
    /**
     * @param {number} totalSeconds 
     * @param {Function} onTick 
     * @param {Function} onExpire 
     */
    constructor(totalSeconds, onTick, onExpire) {
        this.timeLeft = totalSeconds;
        this.initialTime = totalSeconds;
        this.onTick = onTick;
        this.onExpire = onExpire;
        this.interval = null;
    }

    start() {
        if (this.interval) return;
        this.interval = setInterval(() => {
            this.timeLeft--;
            if (this.onTick) this.onTick(this.timeLeft, this.getProgress());
            
            if (this.timeLeft <= 0) {
                this.stop();
                if (this.onExpire) this.onExpire();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset(seconds = null) {
        this.stop();
        this.timeLeft = seconds !== null ? seconds : this.initialTime;
    }

    getProgress() {
        return (this.timeLeft / this.initialTime) * 100;
    }

    getFormattedTime() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
