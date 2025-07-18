// Referencias a los elementos del DOM (actualizadas con nuevos elementos)
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const feedbackContainer = document.getElementById('feedback-container');
const nextButton = document.getElementById('next-button');
const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');

// Nuevas referencias a elementos del DOM para la lógica de inicio/modo
const initialPromptContainer = document.getElementById('initial-prompt-container');
const resumeQuizButton = document.getElementById('resume-quiz-button');
const startNewQuizButton = document.getElementById('start-new-quiz-button');

const modeSelectionContainer = document.getElementById('mode-selection-container');
const orderedModeButton = document.getElementById('ordered-mode-button');
const randomModeButton = document.getElementById('random-mode-button');
const startQuizModeButton = document.getElementById('start-quiz-mode-button');

// Referencia al botón "Volver al Inicio"
const homeButton = document.getElementById('home-button');

// --- NUEVO: Gestor de Pantallas ---
// Array con los IDs de todos los contenedores principales que actúan como "pantallas"
const screenContainers = [
    initialPromptContainer,
    modeSelectionContainer,
    quizContainer,
    resultsContainer
];

/**
 * Oculta todas las pantallas y muestra solo la especificada.
 * Esto garantiza que solo un contenedor principal sea visible a la vez.
 * @param {string} screenId El ID del contenedor a mostrar.
 */
function showScreen(screenId) {
    // Primero, oculta todos los contenedores.
    screenContainers.forEach(container => {
        container.classList.add('hidden');
    });

    // Luego, muestra solo el contenedor deseado.
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.classList.remove('hidden');
    }
}


// Estado del cuestionario
let questions = []; // Preguntas actuales (pueden estar barajadas)
let originalQuestions = []; // Para almacenar las preguntas en su orden original
let currentQuestionIndex = 0;
let score = 0;
let quizMode = 'ordered'; // 'ordered' o 'random'

// Claves para localStorage
const LOCAL_STORAGE_QUIZ_STATE_KEY = 'quizState';

// --- Funciones de Utilidad ---

// Función para barajar un array (algoritmo de Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Guarda el estado actual del cuestionario en localStorage
function saveQuizState() {
    const stateToSave = {
        currentQuestionIndex: currentQuestionIndex,
        score: score,
        questionsLength: originalQuestions.length,
        quizMode: quizMode
    };
    if (quizMode === 'random' && questions.length > 0) {
        stateToSave.questionOrder = questions.map(q => originalQuestions.indexOf(q));
    }
    localStorage.setItem(LOCAL_STORAGE_QUIZ_STATE_KEY, JSON.stringify(stateToSave));
}

// Limpia el estado del cuestionario en localStorage
function clearQuizState() {
    localStorage.removeItem(LOCAL_STORAGE_QUIZ_STATE_KEY);
}

// --- Funciones de Lógica del Cuestionario ---

// Cargar las preguntas desde el archivo JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de preguntas.');
        }
        originalQuestions = await response.json();
        initializeQuizApp();
    } catch (error) {
        showScreen('quiz-container'); // Muestra la pantalla del quiz para el error
        questionElement.textContent = 'Error al cargar el cuestionario. Por favor, inténtalo de nuevo más tarde.';
        console.error(error);
    }
}

// Inicializa la lógica de la aplicación, decidiendo qué mostrar al usuario
function initializeQuizApp() {
    const savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZ_STATE_KEY));
    if (savedState && savedState.currentQuestionIndex > 0 && savedState.questionsLength === originalQuestions.length && savedState.currentQuestionIndex < savedState.questionsLength) {
        showScreen('initial-prompt-container');
    } else {
        showScreen('mode-selection-container');
    }
}

// Maneja la acción de reanudar el cuestionario
function handleResumeQuiz() {
    const savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZ_STATE_KEY));
    if (savedState && savedState.questionsLength === originalQuestions.length && savedState.currentQuestionIndex < savedState.questionsLength) {
        currentQuestionIndex = savedState.currentQuestionIndex;
        score = savedState.score;
        quizMode = savedState.quizMode || 'ordered';

        if (quizMode === 'random' && savedState.questionOrder) {
            questions = savedState.questionOrder.map(idx => originalQuestions[idx]);
        } else {
            questions = [...originalQuestions];
        }
        startQuizSession();
    } else {
        console.warn("Estado guardado inválido, iniciando un nuevo cuestionario.");
        clearQuizState();
        showScreen('mode-selection-container');
    }
}

// Maneja la acción de empezar un nuevo cuestionario
function handleStartNewQuiz() {
    clearQuizState();
    showScreen('mode-selection-container');
}

// Maneja la acción de seleccionar el modo y empezar el cuestionario
function handleSelectModeAndStart() {
    quizMode = randomModeButton.checked ? 'random' : 'ordered';

    if (quizMode === 'random') {
        questions = [...originalQuestions];
        shuffleArray(questions);
    } else {
        questions = [...originalQuestions];
    }
    currentQuestionIndex = 0;
    score = 0;
    saveQuizState();
    startQuizSession();
}

// Inicia la sesión del cuestionario (prepara la UI del quiz)
function startQuizSession() {
    showScreen('quiz-container');
    nextButton.classList.add('hidden');
    feedbackContainer.innerHTML = '';
    feedbackContainer.className = 'feedback-container';

    if (questions.length > 0) {
        showQuestion();
    } else {
        questionElement.textContent = "No hay preguntas disponibles.";
    }
}

// Mostrar la pregunta actual y sus opciones
function showQuestion() {
    resetState();
    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = `Pregunta ${currentQuestionIndex + 1} de ${questions.length}: ${currentQuestion.question}`;

    currentQuestion.options.forEach((optionObject, index) => {
        const button = document.createElement('button');
        button.textContent = optionObject.text;
        button.classList.add('option-btn');
        button.dataset.index = index;
        button.addEventListener('click', selectAnswer);
        optionsContainer.appendChild(button);
    });
}

// Limpiar el estado de la pregunta anterior
function resetState() {
    feedbackContainer.innerHTML = '';
    feedbackContainer.className = 'feedback-container';
    nextButton.classList.add('hidden');
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

// Función que se ejecuta al seleccionar una respuesta
function selectAnswer(e) {
    const selectedButton = e.target;
    const selectedAnswerIndex = parseInt(selectedButton.dataset.index);
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIndex = currentQuestion.correctAnswer;

    Array.from(optionsContainer.children).forEach(button => {
        button.disabled = true;
    });
    
    const feedbackText = currentQuestion.options[selectedAnswerIndex].feedback;
    feedbackContainer.textContent = feedbackText;

    if (selectedAnswerIndex === correctAnswerIndex) {
        score++;
        selectedButton.classList.add('correct');
        feedbackContainer.classList.add('correct');
    } else {
        selectedButton.classList.add('incorrect');
        feedbackContainer.classList.add('incorrect');
        optionsContainer.children[correctAnswerIndex].classList.add('correct');
    }

    nextButton.classList.remove('hidden');
    saveQuizState();
}

// Mostrar los resultados finales
function showResults() {
    showScreen('results-container');
    scoreElement.textContent = `Tu puntuación final es: ${score} de ${questions.length}`;
}

// Función para reiniciar la aplicación por completo
function resetApplication() {
    clearQuizState();
    currentQuestionIndex = 0;
    score = 0;
    questions = [];
    initializeQuizApp();
}

// --- Event Listeners ---

nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        saveQuizState();
        showQuestion();
    } else {
        clearQuizState();
        showResults();
    }
});

restartButton.addEventListener('click', () => {
    clearQuizState();
    showScreen('mode-selection-container');
});

resumeQuizButton.addEventListener('click', handleResumeQuiz);
startNewQuizButton.addEventListener('click', handleStartNewQuiz);
startQuizModeButton.addEventListener('click', handleSelectModeAndStart);

homeButton.addEventListener('click', resetApplication);

// Iniciar todo el proceso al cargar la página
loadQuestions();