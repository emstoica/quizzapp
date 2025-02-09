let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let questionPool = [];
let correctCount = 0;
let wrongQuestions = [];

// Load questions from JSON
async function loadQuestions() {
    const response = await fetch('questions.json');
    questions = await response.json();
}

// Start the quiz
async function startQuiz() {
    await loadQuestions();
    
    let numQuestions = parseInt(document.getElementById("question-count").value);
    numQuestions = Math.min(numQuestions, questions.length);

    questionPool = questions.sort(() => Math.random() - 0.5).slice(0, numQuestions);

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";

    loadQuestion();
}

// Load a question
function loadQuestion() {
    selectedAnswers = [];
    let question = questionPool[currentQuestionIndex];

    document.getElementById("question-text").innerText = question.question;
    let answersContainer = document.getElementById("answers-container");
    answersContainer.innerHTML = "";

    Object.keys(question.answers).forEach(number => {
        let answerText = question.answers[number];
        if (answerText) {
            let button = document.createElement("button");
            button.innerText = answerText;
            button.dataset.choice = number;
            button.classList.add("answer-button");
            button.onclick = () => toggleSelection(button);
            answersContainer.appendChild(button);
        }
    });

    // Reset buttons state
    document.getElementById("submit-button").disabled = true;
    document.getElementById("next-button").style.display = "none";
}

// Toggle answer selection (max 2 answers)
function toggleSelection(button) {
    if (document.getElementById("submit-button").disabled === true) {
        return; // Prevent selection after submitting
    }

    let choice = button.dataset.choice;

    if (selectedAnswers.includes(choice)) {
        selectedAnswers = selectedAnswers.filter(ans => ans !== choice);
        button.classList.remove("selected");
    } else {
        if (selectedAnswers.length < 2) {
            selectedAnswers.push(choice);
            button.classList.add("selected");
        }
    }

    // Enable the submit button only if at least one answer is selected
    document.getElementById("submit-button").disabled = selectedAnswers.length === 0;
}

// Check the answer
function checkAnswer() {
    let question = questionPool[currentQuestionIndex];
    let correctAnswers = question.correct.sort();
    let selectedSorted = selectedAnswers.sort();

    let answerButtons = document.querySelectorAll("#answers-container button");
    let isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctAnswers);

    answerButtons.forEach(btn => {
        btn.onclick = null; // Disable answer selection after submission

        if (selectedAnswers.includes(btn.dataset.choice)) {
            btn.classList.add("selected-emphasized");
        }
        if (correctAnswers.includes(btn.dataset.choice)) {
            btn.classList.add("correct");
        } else {
            btn.classList.add("incorrect");
        }
    });

    // Disable "Submit Answer" after submission
    document.getElementById("submit-button").disabled = true;

    if (isCorrect) {
        correctCount++;
    } else {
        wrongQuestions.push({
            question: question.question,
            correct: correctAnswers.map(num => question.answers[num]).join(", "),
            yourAnswer: selectedAnswers.length > 0 
                ? selectedAnswers.map(num => question.answers[num]).join(", ") 
                : "No answer"
        });
    }

    // Show "Next Question" button
    document.getElementById("next-button").style.display = "block";
}

// Go to the next question
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionPool.length) {
        loadQuestion();
    } else {
        showSummary();
    }
}

// Show summary at the end
function showSummary() {
    document.getElementById("quiz-screen").style.display = "none";
    let summaryScreen = document.createElement("div");
    summaryScreen.id = "summary-screen";
    summaryScreen.innerHTML = `<h2>Quiz Summary</h2>
        <p>You answered ${correctCount} out of ${questionPool.length} questions correctly.</p>
        <h3>Incorrect Answers:</h3>`;

    if (wrongQuestions.length > 0) {
        let wrongList = document.createElement("ul");
        wrongQuestions.forEach(item => {
            let li = document.createElement("li");
            li.innerHTML = `<strong>Q:</strong> ${item.question}<br>
                            <strong>Your Answer:</strong> ${item.yourAnswer}<br>
                            <strong>Correct Answer:</strong> ${item.correct}`;
            wrongList.appendChild(li);
        });
        summaryScreen.appendChild(wrongList);
    } else {
        summaryScreen.innerHTML += "<p>Great job! No incorrect answers.</p>";
    }

    let restartButton = document.createElement("button");
    restartButton.innerText = "Restart Quiz";
    restartButton.onclick = () => location.reload();
    summaryScreen.appendChild(restartButton);

    document.body.appendChild(summaryScreen);
}
