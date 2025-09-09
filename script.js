const proxyURL = 'https://cors-anywhere.herokuapp.com/';

// Form & Inputs
const form = document.getElementById('form');
const URLInput = document.getElementById('url');
const marksForCorrectAnswerInput = document.getElementById('marksForCorrectAns');
const marksForWrongAnswerInput = document.getElementById('marksForWrongAns');
const checkScoreButton = document.getElementById('check_score_btn');

// Loader
const loader = document.getElementById('loader');

// Flip container
const flipContainer = document.querySelector('.flip-container');
const checkAnotherBtn = document.getElementById('checkAnotherBtn');

// Front face error
const errorContainer = document.getElementById('errorContainer');
const errorEl = document.getElementById('error');

// Back face result elements
const scoreEl = document.getElementById('score');
const percentageEl = document.getElementById('percentage');
const correctCountEl = document.getElementById('correctCount');
const wrongCountEl = document.getElementById('wrongCount');
const notAnsweredEl = document.getElementById('notAnswered');
const answeredQuestionsEl = document.getElementById('answeredQuestions');
const totalQuestionsEl = document.getElementById('totalQuestions');

// Form submission
form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) return;
    e.preventDefault();
    checkScore();
});

// Fetch data with error handling
const fetchData = async (URL) => {
    let err = 'none';
    try {
        const response = await fetch(URL);

        if (!response.ok) {
            switch (response.status) {
                case 400: err = 'Bad Request - Check the URL and try again.'; break;
                case 401: err = 'Unauthorized - You do not have permission to access this resource.'; break;
                case 403: err = 'Forbidden - You do not have permission to access this resource.'; break;
                case 404: err = 'Not Found - The requested resource could not be found. URL might be incorrect.'; break;
                case 429:
                    const retryAfter = response.headers.get('Retry-After');
                    err = retryAfter ? `Too Many Requests - Wait ${retryAfter} seconds.` : 'Too Many Requests - Please try again later.';
                    break;
                case 500: err = 'Internal Server Error - Please try again later.'; break;
                case 502: err = 'Bad Gateway - Please try again later.'; break;
                case 503: err = 'Service Unavailable - Please try again later.'; break;
                case 504: err = 'Gateway Timeout - Please try again later.'; break;
                default: err = `Unexpected Error: ${response.status} - ${response.statusText}`; break;
            }
            return { response: null, err };
        }

        return { response, err };
    } catch (error) {
        err = 'Network Error - Please check your internet connection.';
        return { response: null, err };
    }
};

// Check score
const checkScore = async () => {
    const targetURL = URLInput.value;
    const marksForCorrectAnswer = parseFloat(marksForCorrectAnswerInput.value);
    const marksForWrongAnswer = parseFloat(marksForWrongAnswerInput.value);

    // Disable button & show loader
    checkScoreButton.disabled = true;
    checkScoreButton.style.cursor = 'not-allowed';
    checkScoreButton.innerText = 'Checking Score...';
    loader.style.display = 'block';
    errorContainer.style.display = 'none';
    errorEl.innerText = '';

    const { response, err } = await fetchData(proxyURL + targetURL);

    if (err !== 'none') {
        errorContainer.style.display = 'block';
        errorEl.innerText = err;
        console.log(err);
    } else {
        try {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const answers = [...doc.querySelectorAll('.rightAns')].map(el => el.innerText);
            const selectedAnswers = [...doc.querySelectorAll('.questionPnlTbl .rw > table:nth-child(2) tr:last-child > td:last-child')].map(el => el.innerText);

            let correctAnswers = 0;
            let wrongAnswers = 0;
            let notAnswered = 0;

            for (let i in answers) {
                const selected = selectedAnswers[i].trim();
                if (selected === '--' || selected === '') {
                    notAnswered++;
                } else if (answers[i][0] === selected) {
                    correctAnswers++;
                } else {
                    wrongAnswers++;
                }
            }

            const totalQuestions = answers.length;
            const answeredQuestions = totalQuestions - notAnswered;

            const marksObtainedForCorrectAnswers = correctAnswers * marksForCorrectAnswer;
            const marksObtainedForWrongAnswers = wrongAnswers * marksForWrongAnswer;
            const obtainedScore = marksObtainedForCorrectAnswers + marksObtainedForWrongAnswers;
            const totalScore = totalQuestions * marksForCorrectAnswer; // max possible score
            const percentageScore = totalScore ? ((obtainedScore / totalScore) * 100).toFixed(2) : 0;

            // Populate back face
            scoreEl.innerText = `${obtainedScore} / ${totalScore}`;
            percentageEl.innerText = `${percentageScore}%`;
            correctCountEl.innerText = correctAnswers;
            wrongCountEl.innerText = wrongAnswers;
            notAnsweredEl.innerText = notAnswered;
            answeredQuestionsEl.innerText = answeredQuestions;
            totalQuestionsEl.innerText = totalQuestions;

            // Flip to back face
            flipContainer.classList.add('flipped');

        } catch (error) {
            errorContainer.style.display = 'block';
            errorEl.innerText = 'Error parsing data. Please check the URL.';
            console.log(error);
        }
    }

    // Re-enable button & hide loader
    checkScoreButton.disabled = false;
    checkScoreButton.style.cursor = 'pointer';
    checkScoreButton.innerText = 'Check Score';
    loader.style.display = 'none';
};

// Check another result (flip back)
checkAnotherBtn.addEventListener('click', () => {
    flipContainer.classList.remove('flipped');
    URLInput.value = '';
});