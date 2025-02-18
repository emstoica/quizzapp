let questions = [];
let currentQuestionIndex = 0;
// Track selected answers per question
let selectedAnswers = {};
let questionPool = [];
let correctCount = 0;
let wrongQuestions = [];
let correctQuestions = [];
let timerInterval;
let startTime;
let countdownTime;
let isTimerVisible = true;

// Dark Mode
const toggleButton = document.getElementById("dark-mode-toggle");
const body = document.body;

// Check if user has a preferred theme saved
if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    // Detect user's system preference for dark mode
    body.classList.add("dark");
}

toggleButton.addEventListener("click", function () {
    let isDarkMode = body.classList.contains("dark");

    if (isDarkMode) {
        body.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        body.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
});



//Timer
// Timer display elements
const timerText = document.getElementById('timer-text');
const timerDisplay = document.getElementById('timer-display');
const toggleTimerButton = document.getElementById('toggle-timer');
const showSVG = document.getElementById('showSVG');
const hideSVG = document.getElementById('hideSVG');

// Toggle timer visibility
function toggleTimer() {
    isTimerVisible = !isTimerVisible;
    
    // Toggle the timer visibility with d-none class
    timerText.classList.toggle('d-none', !isTimerVisible);
    
    // Toggle the button text and SVG
    // toggleTimerButton.textContent = isTimerVisible ? 'Hide Timer' : 'Show Timer';
    showSVG.classList.toggle('d-none', isTimerVisible);
    hideSVG.classList.toggle('d-none', !isTimerVisible);
}

// Timer controls
const timerTypeRadios = document.querySelectorAll('input[name="timer-type"]');
const countdownSettings = document.getElementById('countdown-settings');
const countdownMinutesInput = document.getElementById('countdown-minutes');

// Time's up popup
const timeUpPopup = document.getElementById('time-up-popup');
const continueQuizButton = document.getElementById('continue-quiz');
const restartQuizButton = document.getElementById('restart-quiz');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const timerTypeRadios = document.querySelectorAll('input[name="timer-type"]');
    const countdownSettings = document.getElementById('countdown-settings');

    // Function to toggle countdown settings visibility
    const toggleCountdownSettings = () => {
        const selectedTimerType = document.querySelector('input[name="timer-type"]:checked').value;
        if (selectedTimerType === 'countdown') {
            countdownSettings.classList.remove('d-none');  // Show countdown settings
            countdownSettings.classList.add('d-flex');
        } else {
            countdownSettings.classList.remove('d-flex');  // Hide countdown settings
            countdownSettings.classList.add('d-none');
        }
    };
    

    // Add event listeners to radio buttons
    timerTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleCountdownSettings);
    });

    // Set initial state based on the selected radio button
    toggleCountdownSettings();
});

let isTimerRunning = false;  // Track if the timer has started

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
        timerText.textContent = '00:00';
        document.getElementById("time-up-popup").classList.remove('d-none');
    } else {
        timerText.textContent = formatTime(remainingTime);
    }
}

// Format time as MM:SS or HH:MM:SS
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // If time exceeds 60 minutes, format as HH:MM:SS
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        // Otherwise, format as MM:SS
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}




// Load questions
async function loadQuestions() {
    console.log('Loading questions...');
    const response = await fetch('cleaned-questions.json');
    questions = await response.json();
    console.log(`Loaded ${questions.length} questions`);
}

// Filter questions based on selected topic
function filterQuestions(allQuestions) {
    console.log('Filtering questions...');
    const checkboxes = document.querySelectorAll('.materie-option');
    let selectedSubjects = [];

    checkboxes.forEach(cb => {
        if (cb.value !== "all" && cb.checked) {
            selectedSubjects.push(cb.value);
        }
    });

    console.log(`Selected subjects: ${selectedSubjects.join(', ')}`);
    if (selectedSubjects.length === 0) {
        console.log("No subjects selected, returning all questions.");
        return allQuestions;
    }

    return allQuestions.filter(q => selectedSubjects.includes(q.Materie));
}

document.querySelectorAll('.materie-option').forEach(switchEl => {
    switchEl.addEventListener('change', function() {
        const allSwitch = document.getElementById('all');
        const allSelected = document.querySelectorAll('.materie-option:checked').length;

        console.log('Switch changed:', this.id);
        console.log('Currently selected switches:', allSelected);

        // If any Materie switch (except "Toate") is selected, uncheck the "Toate" switch
        if (this !== allSwitch && this.checked) {
            allSwitch.checked = false;
            console.log('Toate switch unchecked');
        }

        // If all Materie switches are selected, check "Toate"
        if (allSelected === 5) {  // Assuming 5 Materie switches
            allSwitch.checked = true;
            console.log('All Materie switches selected. Toate is checked');
            document.querySelectorAll('.materie-option').forEach(el => {
                if (el !== allSwitch) el.checked = false;
            });
        }

        // If "Toate" is checked, uncheck all other switches
        if (allSwitch.checked) {
            console.log('Toate is checked. Unchecking other switches');
            document.querySelectorAll('.materie-option').forEach(el => {
                if (el !== allSwitch) el.checked = false;
            });
        }

        console.log('Toate switch checked:', allSwitch.checked);
        console.log('Final selected switches:', document.querySelectorAll('.materie-option:checked').length);
    });
});


// Start timer or countdown automatically when quiz starts
async function startQuiz() {
    console.log('Starting quiz...');
   


    const selectedTimerType = document.querySelector('input[name="timer-type"]:checked').value;
    console.log(`Selected timer type: ${selectedTimerType}`);

    // Show or hide the timer based on the selection
    if (selectedTimerType === 'timer') {
        console.log('Starting timer...');
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        timerDisplay.classList.remove('d-none');
        timerDisplay.classList.add('d-block');
    } else if (selectedTimerType === 'countdown') {
        console.log('Starting countdown...');
        const minutes = parseInt(countdownMinutesInput.value);
        countdownTime = minutes * 60 * 1000; // Convert minutes to milliseconds
        startTime = Date.now();
        timerInterval = setInterval(updateCountdown, 1000);
        timerDisplay.classList.remove('d-none');
        timerDisplay.classList.add('d-block');
    } else {
        // None selected: hide timer display
        console.log('No timer selected.');
        timerDisplay.classList.add('d-none');
    }

    // Load questions
    await loadQuestions();

    // Filter questions using the filter options from the start screen
    let filteredQuestions = filterQuestions(questions);
    console.log(`Filtered questions: ${filteredQuestions.length}`);
    if (filteredQuestions.length === 0) {
        alert("Nu există întrebări pentru materiile selectate!");
        return;
    }
    
    let numQuestions = parseInt(document.getElementById("question-count").value);
    numQuestions = Math.min(numQuestions, filteredQuestions.length);

    questionPool = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, numQuestions);

    // Hide start screen and show quiz screen
    document.getElementById("start-screen").classList.add("d-none");
    document.getElementById("quiz-screen").classList.remove("d-none");

    // Load first question
    loadQuestion();
}


function loadQuestion() {
    if (!selectedAnswers) {
        selectedAnswers = []; // Ensure selectedAnswers is initialized
    }
    
    if (!selectedAnswers[currentQuestionIndex]) {
        selectedAnswers[currentQuestionIndex] = []; // Reset only current question's selection
    }

    console.log(`Loading question ${currentQuestionIndex + 1} of ${questionPool.length}`);

    // Reset visibility of action buttons
    const skipButton = document.getElementById("skip-button");
    const submitButton = document.getElementById("submit-button");
    const seeResultsButton = document.getElementById("see-results-button");

    if (skipButton) skipButton.classList.remove("d-none");
    if (submitButton) submitButton.classList.remove("d-none");
    if (seeResultsButton) seeResultsButton.classList.add("d-none");

    let question = questionPool[currentQuestionIndex];

    console.log(`Question: ${question.question}`);

    // Display question counter
    document.getElementById("question-counter").innerText = `${currentQuestionIndex + 1} din ${questionPool.length}`;

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

            // Restore previous selection
            if (selectedAnswers[currentQuestionIndex].includes(number)) {
                button.classList.add("selected");
            }

            button.onclick = () => toggleSelection(button);
            answersContainer.appendChild(button);
        }
    });

    // Ensure "Submit Answer" button starts disabled
    document.getElementById("submit-button").disabled = selectedAnswers[currentQuestionIndex].length === 0;

    document.getElementById("next-button").classList.add('d-none');
    document.getElementById("skip-button").onclick = skipQuestion;
    document.getElementById("skip-button").disabled = questionPool.length === 1;


    
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
    console.log(`Moving to next question...`);
    currentQuestionIndex++;

    if (currentQuestionIndex < questionPool.length) {
        console.log(`Next question: ${currentQuestionIndex + 1}`);
        loadQuestion();
    } else {
        console.log('All questions completed.');
        showSummary();
    }

     // Hide Next and Submit buttons after last question
     if (currentQuestionIndex >= questionPool.length) {
        document.getElementById("next-button").classList.add('d-none');
        document.getElementById("submit-button").classList.add('d-none');
        document.getElementById("skip-button").classList.add('d-none');
        document.getElementById("see-results-button").classList.remove('d-none');
    } else {
        document.getElementById("next-button").classList.add('d-none');
        document.getElementById("submit-button").classList.remove('d-none');
        document.getElementById("skip-button").classList.remove('d-none');
        document.getElementById("see-results-button").classList.add('d-none');
    }
}

// Skip Question
function skipQuestion() {
    console.log(`Skipping question: ${currentQuestionIndex + 1}`);

    if (questionPool.length > 1) {
        // Move current question to the end
        let skippedQuestion = questionPool.splice(currentQuestionIndex, 1)[0];
        questionPool.push(skippedQuestion);

        console.log("Question moved to end of queue.");

        // Load next question
        if (currentQuestionIndex >= questionPool.length) {
            currentQuestionIndex = 0;
        }

        loadQuestion();
    }
}


// Toggle Answer Selection
function toggleSelection(button) {
    console.log(`Answer selected: ${button.innerText}`);
    let choice = button.dataset.choice;

    // Ensure selectedAnswers is structured as an array of arrays (one per question)
    if (!selectedAnswers[currentQuestionIndex]) {
        selectedAnswers[currentQuestionIndex] = [];
    }

    let selectedForCurrentQuestion = selectedAnswers[currentQuestionIndex];

    // Toggle selection: Remove if already selected, otherwise add
    if (selectedForCurrentQuestion.includes(choice)) {
        selectedAnswers[currentQuestionIndex] = selectedForCurrentQuestion.filter(ans => ans !== choice);
        button.classList.remove("selected");
    } else if (selectedForCurrentQuestion.length < 2) { // Limit selection to 2
        selectedForCurrentQuestion.push(choice);
        button.classList.add("selected");
    }

    document.getElementById("submit-button").disabled = selectedForCurrentQuestion.length === 0;
}



// Check Answer Function
function checkAnswer() {
    console.log('Checking answer...');
    let question = questionPool[currentQuestionIndex];
    let correctAnswers = question.correct.map(String);
    
    // Ensure selectedAnswers[currentQuestionIndex] is an array
    let selectedSorted = [...(selectedAnswers[currentQuestionIndex] || [])].sort();

    console.log(`Correct answers: ${correctAnswers}`);
    console.log(`User selected: ${selectedSorted}`);

    let answerButtons = document.querySelectorAll("#answers-container button");
    let isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctAnswers);

    answerButtons.forEach(btn => {
        btn.onclick = null; // Disable button clicks
        btn.classList.add("disabled-answer"); // Style as disabled
        let choice = btn.dataset.choice;

        if (correctAnswers.includes(choice)) {
            btn.classList.add("correct-border"); // Green border for correct answers
        }
        if (selectedAnswers[currentQuestionIndex]?.includes(choice)) {
            btn.classList.add("selected"); // Bold only selected answers
            if (!correctAnswers.includes(choice)) {
                btn.classList.add("incorrect"); // Red background for wrong selections
            }
        }
    });

    // Track correct/incorrect answers
    correctQuestions.push({
        question: question.question,
        options: question.answers,
        selected: selectedAnswers[currentQuestionIndex]?.map(ans => question.answers[ans]) || [],
        correct: correctAnswers.map(ans => question.answers[ans])
    });

    if (!isCorrect) {
        wrongQuestions.push({
            question: question.question,
            options: question.answers,
            selected: selectedAnswers[currentQuestionIndex]?.map(ans => question.answers[ans]) || [],
            correct: correctAnswers.map(ans => question.answers[ans])
        });
    } else {
        correctCount++;
    }

    // Hide "Submit Answer" button and show either "Next Question" or "See Results" button
    document.getElementById("submit-button").classList.add('d-none');

    if (currentQuestionIndex === questionPool.length - 1) {
        // Show "See Results" button on the last question
        document.getElementById("next-button").classList.add('d-none');
        document.getElementById("see-results-button").classList.remove('d-none');
    } else {
        // Show "Next Question" button for all other questions
        document.getElementById("next-button").classList.remove('d-none');
        document.getElementById("see-results-button").classList.add('d-none');
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
    document.getElementById("next-button").classList.add('d-none');
    document.getElementById("submit-button").classList.remove('d-none');

    // Hide Skip button if only one question is left
    if (currentQuestionIndex === questionPool.length - 1) {
        document.getElementById("skip-button").classList.add('d-none');  // Hide Skip button
    } else {
        document.getElementById("skip-button").classList.remove('d-none');  // Show Skip button
    }
}

// Show Quiz Summary
function showSummary() {
    console.log('Displaying quiz summary...');
    document.getElementById("quiz-screen").classList.add('d-none');
    document.getElementById("quiz-summary").classList.remove('d-none');

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
    summaryContainer2.innerHTML = ""; // Clear previous summary

    questionPool.forEach((entry, index) => {
        let selectedAnswersForQuestion = selectedAnswers[index] || []; // Ensure per-question tracking

        let questionHTML = `<div class="summary-item">
            <p><strong>${index + 1}. ${entry.question}</strong></p>
            <ul>`;

        Object.keys(entry.answers).forEach(optionKey => {
            let optionText = entry.answers[optionKey];
            let isCorrect = entry.correct.includes(optionKey); // Check if correct
            let isSelected = selectedAnswersForQuestion.includes(optionKey); // Check if selected

            let liClass = "answer-button";
            if (isCorrect) liClass += " correct-border";
            if (isSelected && !isCorrect) liClass += " incorrect";

            let displayOptionText = isSelected ? `<strong>${optionText}</strong>` : optionText;

            questionHTML += `<li class="${liClass}">${displayOptionText}</li>`;
        });

        questionHTML += `</ul></div><hr>`;
        summaryContainer2.innerHTML += questionHTML;
    });
}



// Restart Quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongQuestions = [];
    correctQuestions = [];
    document.getElementById("quiz-summary").classList.add('d-none');
    document.getElementById("quiz-screen").classList.add('d-none');
    document.getElementById("start-screen").classList.remove('d-none');
    document.getElementById("time-up-popup").classList.add('d-none');


    selectedAnswers = [];

    clearInterval(timerInterval);
    timerText.textContent = '00:00';
    
}

// Show Toast Notification
window.onload = function() {
    let toastElement = document.getElementById("disclaimer");
    let toast = new bootstrap.Toast(toastElement, { autohide: false });
    toast.show();
};