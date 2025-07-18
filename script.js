// Referencias a los elementos del DOM (sin cambios)
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const feedbackContainer = document.getElementById('feedback-container');
const nextButton = document.getElementById('next-button');
const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');

// Estado del cuestionario (sin cambios)
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Cargar las preguntas desde el archivo JSON (sin cambios)
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de preguntas.');
        }
        questions = await response.json();
        startQuiz();
    } catch (error) {
        questionElement.textContent = 'Error al cargar el cuestionario. Por favor, inténtalo de nuevo más tarde.';
        console.error(error);
    }
}

// Iniciar o reiniciar el cuestionario (sin cambios)
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    resultsContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    nextButton.classList.add('hidden');
    showQuestion();
}

// === CAMBIO AQUÍ ===
// Mostrar la pregunta actual y sus opciones
function showQuestion() {
    resetState();
    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;

    // Ahora iteramos sobre un array de objetos
    currentQuestion.options.forEach((optionObject, index) => {
        const button = document.createElement('button');
        // Usamos optionObject.text para el contenido del botón
        button.textContent = optionObject.text; 
        button.classList.add('option-btn');
        button.dataset.index = index;
        button.addEventListener('click', selectAnswer);
        optionsContainer.appendChild(button);
    });
}

// Limpiar el estado anterior (sin cambios)
function resetState() {
    feedbackContainer.innerHTML = '';
    feedbackContainer.className = 'feedback-container';
    nextButton.classList.add('hidden');
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

// === CAMBIO PRINCIPAL AQUÍ ===
// Función que se ejecuta al seleccionar una respuesta
function selectAnswer(e) {
    const selectedButton = e.target;
    const selectedAnswerIndex = parseInt(selectedButton.dataset.index);
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIndex = currentQuestion.correctAnswer;

    // Deshabilitar todos los botones para evitar más clics
    Array.from(optionsContainer.children).forEach(button => {
        button.disabled = true;
    });
    
    // Obtenemos el texto del feedback directamente de la opción seleccionada.
    // ¡Esta es la magia del nuevo enfoque!
    const feedbackText = currentQuestion.options[selectedAnswerIndex].feedback;
    feedbackContainer.textContent = feedbackText;

    // Ahora, aplicamos los estilos y actualizamos la puntuación
    if (selectedAnswerIndex === correctAnswerIndex) {
        // Respuesta Correcta
        score++;
        selectedButton.classList.add('correct');
        feedbackContainer.classList.add('correct');
    } else {
        // Respuesta Incorrecta
        selectedButton.classList.add('incorrect');
        feedbackContainer.classList.add('incorrect');
        // Resaltar también la respuesta correcta para que el usuario aprenda
        optionsContainer.children[correctAnswerIndex].classList.add('correct');
    }

    // Mostrar el botón de siguiente pregunta
    nextButton.classList.remove('hidden');
}


// Mostrar los resultados finales (sin cambios)
function showResults() {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    scoreElement.textContent = `Tu puntuación es: ${score} de ${questions.length}`;
}

// Event Listeners para los botones (sin cambios)
nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
});

restartButton.addEventListener('click', startQuiz);

// Iniciar todo el proceso al cargar la página (sin cambios)
loadQuestions();