let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let questionPool = [];
let correctCount = 0;
let wrongQuestions = [];
let correctQuestions = [];
let timerInterval;
let startTime;
let countdownTime;
let isTimerVisible = true;

//Timer
// Timer display elements
const timerText = document.getElementById('timer-text');
const timerDisplay = document.getElementById('timer-display');
const toggleTimerButton = document.getElementById('toggle-timer');

// Timer controls
const timerTypeRadios = document.querySelectorAll('input[name="timer-type"]');
const countdownSettings = document.getElementById('countdown-settings');
const countdownMinutesInput = document.getElementById('countdown-minutes');

// Time's up popup
const timeUpPopup = document.getElementById('time-up-popup');
const continueQuizButton = document.getElementById('continue-quiz');
const restartQuizButton = document.getElementById('restart-quiz');

// Event listeners
timerTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'countdown') {
            countdownSettings.style.display = 'block';
        } else {
            countdownSettings.style.display = 'none';
        }
    });
});

toggleTimerButton.addEventListener('click', toggleTimer);
continueQuizButton.addEventListener('click', () => timeUpPopup.style.display = 'none');
restartQuizButton.addEventListener('click', restartQuiz);

// Update timer (counts up)
function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    timerText.textContent = formatTime(elapsedTime);
}

// Update countdown (counts down)
function updateCountdown() {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = countdownTime - elapsedTime;

    if (remainingTime <= 0) {
        clearInterval(timerInterval);
        timerText.textContent = '00:00:00';
        timeUpPopup.style.display = 'block';
    } else {
        timerText.textContent = formatTime(remainingTime);
    }
}

// Format time as HH:MM:SS
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Toggle timer visibility
function toggleTimer() {
    isTimerVisible = !isTimerVisible;
    timerText.style.display = isTimerVisible ? 'inline' : 'none';
    toggleTimerButton.textContent = isTimerVisible ? 'Hide Timer' : 'Show Timer';
}

// Load questions
async function loadQuestions() {
    const response = await fetch('cleaned-questions.json');
    questions = await response.json();
}

// Filter questions based on selected topic
function filterQuestions(allQuestions) {
    const checkboxes = document.querySelectorAll('.materie-option');
    // If "all" is checked, return all questions
    for (let cb of checkboxes) {
        if (cb.value === "all" && cb.checked) {
            return allQuestions;
        }
    }
    // Otherwise, collect selected subjects
    let selectedSubjects = [];
    checkboxes.forEach(cb => {
        if (cb.value !== "all" && cb.checked) {
            selectedSubjects.push(cb.value);
        }
    });
    // Filter questions where the "Materie" field matches one of the selected subjects
    return allQuestions.filter(q => selectedSubjects.includes(q.Materie));
}

// Start timer or countdown automatically when quiz starts
async function startQuiz() {
    const selectedTimerType = document.querySelector('input[name="timer-type"]:checked').value;

    if (selectedTimerType === 'timer') {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        timerDisplay.style.display = 'block';
    } else if (selectedTimerType === 'countdown') {
        const minutes = parseInt(countdownMinutesInput.value);
        countdownTime = minutes * 60 * 1000; // Convert minutes to milliseconds
        startTime = Date.now();
        timerInterval = setInterval(updateCountdown, 1000);
        timerDisplay.style.display = 'block';
    } else {
        // None selected: hide timer display
        timerDisplay.style.display = 'none';
    }

    // Update the Start Quiz function to filter questions
    await loadQuestions();

    // Filter questions using the filter options from the start screen
    let filteredQuestions = filterQuestions(questions);
    if (filteredQuestions.length === 0) {
        alert("Nu există întrebări pentru materiile selectate!");
        return;
    }
    
    let numQuestions = parseInt(document.getElementById("question-count").value);
    numQuestions = Math.min(numQuestions, filteredQuestions.length);

    questionPool = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, numQuestions);

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

    // Add debug buttons
    let debugContainer = document.createElement("div");
    debugContainer.classList.add("debug-buttons", "mt-3");

    let correctButton = document.createElement("button");
    correctButton.innerText = "Mark Correct";
    correctButton.classList.add("btn", "btn-success", "mr-2");
    correctButton.onclick = () => markCorrect(question);
    debugContainer.appendChild(correctButton);

    let wrongButton = document.createElement("button");
    wrongButton.innerText = "Mark Wrong";
    wrongButton.classList.add("btn", "btn-danger");
    wrongButton.onclick = () => markWrong(question);
    debugContainer.appendChild(wrongButton);

    answersContainer.appendChild(debugContainer);

    document.getElementById("submit-button").disabled = true;
    document.getElementById("next-button").style.display = "none";
}

function markCorrect(question) {
    correctCount++;
    correctQuestions.push({
        question: question.question,
        options: question.answers,
        selected: question.correct.map(ans => question.answers[ans]),
        correct: question.correct.map(ans => question.answers[ans])
    });
    nextQuestion();
}

function markWrong(question) {
    wrongQuestions.push({
        question: question.question,
        options: question.answers,
        selected: [],
        correct: question.correct.map(ans => question.answers[ans])
    });
    nextQuestion();
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

// Check Answer Function
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

    // Track correct/incorrect answers
    correctQuestions.push({
        question: question.question,
        options: question.answers,
        selected: selectedAnswers.map(ans => question.answers[ans]),
        correct: correctAnswers.map(ans => question.answers[ans])
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

    // Hide "Submit Answer" button and show either "Next Question" or "See Results" button
    document.getElementById("submit-button").style.display = "none";

    if (currentQuestionIndex === questionPool.length - 1) {
        // Show "See Results" button on the last question
        document.getElementById("next-button").style.display = "none";
        document.getElementById("check-results-button").style.display = "block";
    } else {
        // Show "Next Question" button for all other questions
        document.getElementById("next-button").style.display = "block";
        document.getElementById("check-results-button").style.display = "none";
    }
}

// Next Question Function
function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questionPool.length) {
        loadQuestion();
    } else {
        showSummary();
    }

    // Hide "Next Question" button and show "Submit Answer" button for next question
    document.getElementById("next-button").style.display = "none";
    document.getElementById("submit-button").style.display = "block";
}

// Show Quiz Summary
function showSummary() {
    document.getElementById("quiz-screen").style.display = "none";
    document.getElementById("quiz-summary").style.display = "block";

    let summaryContainer1 = document.getElementById("summary-container");
    let summaryContainer2 = document.getElementById("summary-container2");

    // Display final score
    summaryContainer1.innerHTML = `<h3>Scor final: ${correctCount} / ${questionPool.length}</h3>`;

   // Display timer or countdown results
   const selectedTimerType = document.querySelector('input[name="timer-type"]:checked').value;
   const summaryContainer = document.getElementById('summary-container');

   if (selectedTimerType === 'timer') {
       const elapsedTime = Date.now() - startTime;
       summaryContainer.innerHTML += `<p>Total time taken: ${formatTime(elapsedTime)}</p>`;
   } else if (selectedTimerType === 'countdown') {
       const remainingTime = countdownTime - (Date.now() - startTime);
       summaryContainer.innerHTML += `<p>Time left: ${formatTime(remainingTime)}</p>`;
   }

    // Show congrats message if all answers are correct
    if (correctCount === questionPool.length) {
        summaryContainer1.innerHTML += `<p>Felicitări! Ai răspuns corect la toate întrebările!</p>`;
        summaryContainer1.innerHTML += `<img src="assets/catcongrats.gif" alt="Congratulations GIF" class="img-fluid mt-4 gifpisica">`;
    } else {
        summaryContainer1.innerHTML += `<p>Spor la învățat!</p>`;
    }

    // Display all questions
    questionPool.forEach((entry, index) => {
        // Create a container for each question
        summaryContainer2.innerHTML += `<div class="summary-item">
            <p><strong>${index + 1}. ${entry.question}</strong></p>
            <ul>`;

        // Display each option
        Object.keys(entry.answers).forEach(optionKey => {
            let optionText = entry.answers[optionKey];
            let isCorrect = entry.correct.includes(optionKey); // Check if the option is correct
            let isSelected = selectedAnswers.includes(optionKey); // Check if the option was selected

            // Add classes for correct and incorrect answers
            let liClass = "";
            if (isCorrect) {
                liClass += "correct-border"; // Highlight correct answers
            }
            if (isSelected && !isCorrect) {
                liClass += " incorrect"; // Highlight incorrect selections
            }

            // Display the option text and mark if it was selected
            summaryContainer2.innerHTML += `
                <li class="${liClass}">
                    ${optionText} ${isSelected ? '<strong>(✔️ Selectat)</strong>' : ''}
                </li>`;
        });

        // Close the question container
        summaryContainer2.innerHTML += `</ul></div><hr>`;
    });
}


// Restart Quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongQuestions = [];
    correctQuestions = [];
    document.getElementById("quiz-summary").style.display = "none";
    document.getElementById("start-screen").style.display = "block";

    clearInterval(timerInterval);
    timeUpPopup.style.display = 'none';
    startTimerButton.disabled = false;
    timerText.textContent = '00:00:00';
    timerDisplay.style.display = 'none';
}

// Show Toast Notification
window.onload = function() {
    let toastElement = document.getElementById("toast-example");
    let toast = new bootstrap.Toast(toastElement, { autohide: false });
    toast.show();
};

