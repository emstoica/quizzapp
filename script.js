let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let questionPool = [];
let correctCount = 0;
let wrongQuestions = [];

// Load questions
async function loadQuestions() {
    const response = await fetch('questions.json');
    questions = await response.json();
}

// Start Quiz
async function startQuiz() {
    await loadQuestions();
    
    let numQuestions = parseInt(document.getElementById("question-count").value);
    numQuestions = Math.min(numQuestions, questions.length);

    questionPool = questions.sort(() => Math.random() - 0.5).slice(0, numQuestions);

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";

    loadQuestion();
}

// Load Question
function loadQuestion() {
    selectedAnswers = [];
    let question = questionPool[currentQuestionIndex];

    // Display question counter: 2 out of 13
    document.getElementById("question-counter").innerText = `Grila ${currentQuestionIndex + 1} din ${questionPool.length}`;

    document.getElementById("question-text").innerText = question.question;
    let answersContainer = document.getElementById("answers-container");
    answersContainer.innerHTML = "";

    Object.keys(question.answers).forEach(number => {
        let answerText = question.answers[number];
        if (answerText) {
            let button = document.createElement("button");
            button.innerText = answerText;
            button.dataset.choice = number;
            button.classList.add("answer-button", "btn", "btn-light", "w-100", "mt-2");
            button.onclick = () => toggleSelection(button);
            answersContainer.appendChild(button);
        }
    });

    document.getElementById("submit-button").disabled = true;
    document.getElementById("next-button").style.display = "none";
}

// Next Question
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questionPool.length) {
        loadQuestion();
    } else {
        showSummary();
    }
}


// Toggle Answer Selection
function toggleSelection(button) {
    let choice = button.dataset.choice;

    if (selectedAnswers.includes(choice)) {
        selectedAnswers = selectedAnswers.filter(ans => ans !== choice);
        button.classList.remove("selected");
    } else if (selectedAnswers.length < 2) {
        selectedAnswers.push(choice);
        button.classList.add("selected");
    }

    document.getElementById("submit-button").disabled = selectedAnswers.length === 0;
}

// Check Answer
function checkAnswer() {
    let question = questionPool[currentQuestionIndex];
    let correctAnswers = question.correct.map(String);
    let selectedSorted = selectedAnswers.sort();

    let answerButtons = document.querySelectorAll("#answers-container button");
    let isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctAnswers);

    answerButtons.forEach(btn => {
        btn.onclick = null;
        btn.disabled = true;
        let choice = btn.dataset.choice;

        if (correctAnswers.includes(choice)) {
            btn.classList.add("correct-border"); // Green border for correct answers
        }
        if (selectedAnswers.includes(choice)) {
            btn.classList.add("bold-text"); // Bold only selected answers
            if (!correctAnswers.includes(choice)) {
                btn.classList.add("incorrect"); // Red background for wrong selections
            }
        }
    });

    if (!isCorrect) {
        wrongQuestions.push({
            question: question.question,
            options: question.answers,
            selected: selectedAnswers.map(ans => question.answers[ans]),
            correct: correctAnswers.map(ans => question.answers[ans])
        });
    } else {
        correctCount++;
    }

    // Hide "Check Answer" button and show "Next Question" button
    document.getElementById("submit-button").style.display = "none";
    document.getElementById("next-button").style.display = "block";
}

// Next Question Function
function nextQuestion() {
    if (currentQuestionIndex < questionPool.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showSummary();
    }

    // Hide "Next Question" button and show "Check Answer" button for next question
    document.getElementById("next-button").style.display = "none";
    document.getElementById("submit-button").style.display = "block";
}


// Show Quiz Summary
function showSummary() {
    document.getElementById("quiz-screen").style.display = "none";
    document.getElementById("quiz-summary").style.display = "block";

    let summaryContainer = document.getElementById("summary-container");
    summaryContainer.innerHTML = `<h3>Scor final: ${correctCount} / ${questionPool.length}</h3>`;

    if (wrongQuestions.length > 0) {
        summaryContainer.innerHTML += `<h4>Grile greșite:</h4>`;
        
        wrongQuestions.forEach((entry, index) => {
            summaryContainer.innerHTML += `<div class="summary-item">
                <p><strong>${index + 1}. ${entry.question}</strong></p>
                <ul>`;
            
            Object.keys(entry.options).forEach(optionKey => {
                let optionText = entry.options[optionKey];
                let isCorrect = entry.correct.includes(optionText);
                let isSelected = entry.selected.includes(optionText);
                
                summaryContainer.innerHTML += `
                    <li class="${isCorrect ? 'correct-border' : ''} ${isSelected && !isCorrect ? 'incorrect' : ''}">
                        ${optionText} ${isSelected ? '(✔️ Selectat)' : ''}
                    </li>`;
            });

            summaryContainer.innerHTML += `</ul></div><hr>`;
        });
    } else {
        summaryContainer.innerHTML += `<p>Felicitări! Ai răspuns corect la toate întrebările!</p>`;
    }
}

// Restart Quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongQuestions = [];
    document.getElementById("quiz-summary").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
}

// Show Toast Notification
window.onload = function() {
    let toastElement = document.getElementById("toast-example");
    let toast = new bootstrap.Toast(toastElement);
    toast.show();
};