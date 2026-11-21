
class QuizBase {
    constructor() {
        this.questionsContainer = document.getElementById("questionsContainer");
        this.timer = null;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
        }
        return array;
    }

    decodeHTML(text) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        return textarea.value;
    }

    escapeAttribute(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

class QuizApp extends QuizBase {
    constructor() {
        super();

        this.quizForm = document.getElementById("quizOptions");
        this.playerNameInput = document.getElementById("playerName");
        this.categoryInput = document.getElementById("categoryMenu");
        this.difficultyInput = document.getElementById("difficultyOptions");
        this.questionsNumberInput = document.getElementById("questionsNumber");
        this.startButton = document.getElementById("startQuiz");

        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.timeLeft = 15;
        this.playerName = "Player";
        this.answerSelected = false;

        this.audioContext = null;

        this.startButton.addEventListener("click", () => this.startQuiz());
    }

    initAudio() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    playTone(frequency, startTime, duration, type = "sine", volume = 0.08) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.02);
    }

    playSound(soundName) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        switch (soundName) {
            case "correct":
                this.playTone(660, now, 0.13, "sine");
                this.playTone(880, now + 0.13, 0.18, "sine");
                break;

            case "wrong":
                this.playTone(260, now, 0.18, "triangle", 0.07);
                this.playTone(190, now + 0.16, 0.24, "triangle", 0.07);
                break;

            case "tick":
                this.playTone(740, now, 0.055, "sine", 0.035);
                break;

            case "timeout":
                this.playTone(440, now, 0.18, "triangle", 0.07);
                this.playTone(330, now + 0.19, 0.2, "triangle", 0.07);
                this.playTone(220, now + 0.4, 0.28, "triangle", 0.07);
                break;

            case "complete":
                this.playTone(523, now, 0.14, "sine");
                this.playTone(659, now + 0.14, 0.14, "sine");
                this.playTone(784, now + 0.28, 0.14, "sine");
                this.playTone(1047, now + 0.42, 0.3, "sine");
                break;
        }
    }

    async startQuiz() {
        this.initAudio();

        const amount = Number(this.questionsNumberInput.value);

        if (!this.validateForm(amount)) {
            return;
        }

        this.playerName = this.playerNameInput.value.trim() || "Player";
        this.score = 0;
        this.streak = 0;
        this.currentQuestionIndex = 0;

        this.showLoading();

        try {
            const questions = await this.getQuestions(amount);

            if (questions.length === 0) {
                this.showError("No questions found. Please change your options and try again.");
                return;
            }

            this.questions = questions;
            this.showQuestion();
        } catch (error) {
            console.error("Quiz loading error:", error);
            this.showError("Failed to load questions. Please check your internet connection.");
        }
    }

    validateForm(amount) {
        this.removeFormError();

        if (!Number.isInteger(amount) || amount < 1 || amount > 50) {
            this.showFormError("Please enter a number between 1 and 50.");
            return false;
        }

        return true;
    }
    async getQuestions(amount) {
        let url = `https://opentdb.com/api.php?amount=${amount}`;

        const category = this.categoryInput.value;
        const difficulty = this.difficultyInput.value;

        if (category !== "") {
            url += `&category=${category}`;
        }
        if (difficulty !== "") {
            url += `&difficulty=${difficulty}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (data.response_code !== 0) {
            throw new Error("No questions available for these options");
        }
        return data.results;
    }
    showLoading() {
        this.questionsContainer.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading Questions...</p>
            </div>
        `;

        this.quizForm.classList.add("hidden");
    }

    showQuestion() {
        this.clearTimer();
        this.answerSelected = false;

        const question = this.questions[this.currentQuestionIndex];

        const answers = this.shuffleArray([
            ...question.incorrect_answers,
            question.correct_answer
        ]);

        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        const category = this.decodeHTML(question.category);
        const questionText = this.decodeHTML(question.question);
        const difficulty = question.difficulty;

        let difficultyIcon = "fa-face-smile";

        if (difficulty === "medium") {
            difficultyIcon = "fa-face-meh";
        } else if (difficulty === "hard") {
            difficultyIcon = "fa-skull";
        }

        this.questionsContainer.innerHTML = `
            <div class="game-card question-card">
                <div class="xp-bar-container">
                    <div class="xp-bar-header">
                        <span class="xp-label">
                            <i class="fa-solid fa-bolt"></i> Progress
                        </span>
                        <span class="xp-value">
                            Question ${this.currentQuestionIndex + 1}/${this.questions.length}
                        </span>
                    </div>
                    <div class="xp-bar">
                        <div class="xp-bar-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-badge category">
                        <i class="fa-solid fa-bookmark"></i>
                        <span>${category}</span>
                    </div>
                    <div class="stat-badge difficulty ${difficulty}">
                        <i class="fa-solid ${difficultyIcon}"></i>
                        <span>${difficulty}</span>
                    </div>
                    <div class="stat-badge timer">
                        <i class="fa-solid fa-stopwatch"></i>
                        <span class="timer-value">15</span>s
                    </div>
                    <div class="stat-badge counter">
                        <i class="fa-solid fa-gamepad"></i>
                        <span>${this.currentQuestionIndex + 1}/${this.questions.length}</span>
                    </div>
                </div>

                <h2 class="question-text">${questionText}</h2>

                <div class="answers-grid">
                    ${answers.map((answer, index) => `
                        <button class="answer-btn" data-answer="${this.escapeAttribute(answer)}">
                            <span class="answer-key">${index + 1}</span>
                            <span class="answer-text">${this.decodeHTML(answer)}</span>
                        </button>
                    `).join("")}
                </div>

                <p class="keyboard-hint">
                    <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
                </p>

                <div class="score-panel">
                    <div class="score-item">
                        <div class="score-item-label">Score</div>
                        <div class="score-item-value">${this.score}</div>
                    </div>
                </div>
            </div>
        `;

        const answerButtons = this.questionsContainer.querySelectorAll(".answer-btn");

        answerButtons.forEach((button) => {
            button.addEventListener("click", () => this.checkAnswer(button));
        });

        this.startTimer();
    }

    checkAnswer(selectedButton) {
        if (this.answerSelected) return;

        this.answerSelected = true;
        this.clearTimer();

        const currentQuestion = this.questions[this.currentQuestionIndex];
        const correctAnswer = currentQuestion.correct_answer;
        const selectedAnswer = selectedButton.dataset.answer;

        const answerButtons = this.questionsContainer.querySelectorAll(".answer-btn");

        answerButtons.forEach((button) => {
            button.disabled = true;

            if (button.dataset.answer === correctAnswer) {
                button.classList.add("correct-reveal");
            }
        });

        if (selectedAnswer === correctAnswer) {
            selectedButton.classList.remove("correct-reveal");
            selectedButton.classList.add("correct");

            this.score += 1;
            this.streak += 1;
            this.playSound("correct");
        } else {
            selectedButton.classList.add("wrong");
            this.streak = 0;
            this.playSound("wrong");
        }

        const scoreValue = this.questionsContainer.querySelector(".score-item-value");
        scoreValue.textContent = this.score;

        setTimeout(() => {
            this.nextQuestion();
        }, 1200);
    }

    startTimer() {
        this.timeLeft = 15;

        this.timer = setInterval(() => {
            this.timeLeft--;

            const timerBadge = this.questionsContainer.querySelector(".stat-badge.timer");
            const timerValue = this.questionsContainer.querySelector(".timer-value");

            if (!timerBadge || !timerValue) {
                this.clearTimer();
                return;
            }

            timerValue.textContent = this.timeLeft;

            if (this.timeLeft <= 5) {
                timerBadge.classList.add("warning");
                this.playSound("tick");
            }

            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.timeIsUp();
            }
        }, 1000);
    }

    timeIsUp() {
        if (this.answerSelected) return;

        this.answerSelected = true;
        this.streak = 0;
        this.playSound("timeout");

        const correctAnswer = this.questions[this.currentQuestionIndex].correct_answer;
        const answerButtons = this.questionsContainer.querySelectorAll(".answer-btn");

        answerButtons.forEach((button) => {
            button.disabled = true;

            if (button.dataset.answer === correctAnswer) {
                button.classList.add("correct-reveal");
            } else {
                button.classList.add("disabled");
            }
        });

        const questionCard = this.questionsContainer.querySelector(".question-card");

        questionCard.insertAdjacentHTML("beforeend", `
            <div class="time-up-message">
                <i class="fa-solid fa-clock"></i> TIME'S UP!
            </div>
        `);

        setTimeout(() => {
            this.nextQuestion();
        }, 1200);
    }

    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        this.clearTimer();
        this.playSound("complete");

        const percentage = Math.round(
            (this.score / this.questions.length) * 100
        );

        const isNewRecord = this.saveScore(percentage);
        const leaderboard = this.getLeaderboard();

        this.questionsContainer.innerHTML = `
            <div class="game-card results-card">

                <div class="results-trophy">🏆</div>

                <h2 class="results-title">Quiz Complete!</h2>

                <p class="results-score-display">
                    ${this.score}/${this.questions.length}
                </p>

                <p class="results-percentage">${percentage}% Accuracy</p>

                ${isNewRecord ? `
                    <div class="new-record-badge">
                        <i class="fa-solid fa-star"></i> New High Score!
                    </div>
                ` : ""}

                <div class="leaderboard">
                    <h4 class="leaderboard-title">
                        <i class="fa-solid fa-trophy"></i> Leaderboard
                    </h4>

                    <ul class="leaderboard-list">
                        ${leaderboard.map((item, index) => `
                            <li class="leaderboard-item ${this.getRankClass(index)}">
                                <span class="leaderboard-rank">#${index + 1}</span>
                                <span class="leaderboard-name">${this.decodeHTML(item.name)}</span>
                                <span class="leaderboard-score">${item.percentage}%</span>
                            </li>
                        `).join("")}
                    </ul>
                </div>

                <div class="action-buttons">
                    <button class="btn-restart" id="restartQuiz">
                        <i class="fa-solid fa-rotate-right"></i> Play Again
                    </button>
                </div>

            </div>
        `;

        document.getElementById("restartQuiz").addEventListener("click", () => {
            this.questionsContainer.innerHTML = "";
            this.quizForm.classList.remove("hidden");
            this.removeFormError();
            this.clearTimer();
        });
    }
    saveScore(percentage) {
        const leaderboard = this.getLeaderboard();

        const oldBestScore = leaderboard.length > 0
            ? leaderboard[0].percentage
            : 0;

        leaderboard.push({
            name: this.playerName,
            percentage: percentage,
            score: this.score
        });

        leaderboard.sort((a, b) => b.percentage - a.percentage);

        localStorage.setItem(
            "quizMasterLeaderboard",
            JSON.stringify(leaderboard.slice(0, 5))
        );

        return percentage > oldBestScore;
    }

    getLeaderboard() {
        const savedScores = localStorage.getItem("quizMasterLeaderboard");

        return savedScores ? JSON.parse(savedScores) : [];
    }

    getRankClass(index) {
        if (index === 0) {
            return "gold";
        }

        if (index === 1) {
            return "silver";
        }

        if (index === 2) {
            return "bronze";
        }

        return "";
    }

    showError(message) {
        this.questionsContainer.innerHTML = `
            <div class="game-card error-card">

                <div class="error-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3 class="error-title">Oops! Something went wrong</h3>

                <p class="error-message">${message}</p>

                <button class="btn-play retry-btn" id="retryQuiz">
                    <i class="fa-solid fa-rotate-right"></i> Try Again
                </button>

            </div>
        `;

        document.getElementById("retryQuiz").addEventListener("click", () => {
            this.questionsContainer.innerHTML = "";
            this.quizForm.classList.remove("hidden");
        });
    }

    showFormError(message) {
        const error = document.createElement("div");

        error.className = "form-error";

        error.innerHTML = `
            <i class="fa-solid fa-circle-exclamation"></i> ${message}
        `;

        this.quizForm.insertBefore(error, this.startButton);
    }

    removeFormError() {
        const oldError = this.quizForm.querySelector(".form-error");

        if (oldError) {
            oldError.remove();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new QuizApp();
});