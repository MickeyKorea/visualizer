// DOM
const canvas = document.getElementById('canvas');
const playButton = document.getElementById('playButton');
const buttonHide = 4000;
let buttonTimeout;

let ctx;
let audio;
let lyrics = [];
let isPlaying = false;
let currentLyricIndex = 0;
let inputText = '';
let textPositions = [];

// Constants for visualizer
const GRID_SPACE_X = 40;
const GRID_SPACE_Y = 40;
const FONT_SIZE = 32;
const GLOW_INTENSITY = 20;
const FONT_STYLE = '32px "Helvetica", "Arial", sans-serif';
const LETTER_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTER_CHANGE_PROBABILITY = 0.01; // 1% chance to change random letters
const DISPLAY_DURATION = 5000;
const TRANSITION_DURATION = 1000;

const letterStates = new Map();

async function init() {
    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup audio
    audio = new Audio('./assets/you.mp3');
    audio.addEventListener('ended', () => {
        isPlaying = false;
        currentLyricIndex = 0;
        inputText = '';
        textPositions = [];
    });

    // Load lyrics
    fetch('./assets/you.json')
        .then(response => response.json())
        .then(data => {
            lyrics = data.map(lyric => ({
                text: lyric.text.toUpperCase(),
                time: lyric.time
            }));
        });

    audio.addEventListener('ended', () => {
        isPlaying = false;
        currentLyricIndex = 0;
        inputText = '';
        textPositions = [];
        playButton.textContent = 'PLAY';
    });

    // Setup play button
    playButton.addEventListener('click', togglePlay);

    // Mouse move and initial button setup
    document.addEventListener('mousemove', showButton);
    playButton.style.transition = 'opacity 0.3s ease';
    showButton();

    // Start animation loop
    requestAnimationFrame(draw);
}

function showButton() {
    playButton.style.opacity = '1';

    // Clear any existing timeout
    if (buttonTimeout) {
        clearTimeout(buttonTimeout);
    }

    // Set new timeout to hide button
    buttonTimeout = setTimeout(() => {
        playButton.style.opacity = '0';
    }, buttonHide);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateLyrics();

    // Set text properties
    ctx.font = FONT_STYLE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.imageSmoothingEnabled = false;

    // Draw grid
    for (let x = GRID_SPACE_X / 2; x < canvas.width; x += GRID_SPACE_X) {
        for (let y = GRID_SPACE_Y / 2; y < canvas.height; y += GRID_SPACE_Y) {
            const forcedLetter = getInputLetterForPosition(x, y);

            // Reset shadow after each letter
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';

            if (forcedLetter) {
                setGlow(ctx, 'white', GLOW_INTENSITY);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            } else {
                setGlow(ctx, 'tomato', GLOW_INTENSITY);
                ctx.fillStyle = 'rgba(255, 99, 71, 0.8)';
            }

            gridText(x, y, forcedLetter);
        }
    }

    requestAnimationFrame(draw);
}

function setGlow(ctx, color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    // prevent shadow from being too soft
    ctx.globalCompositeOperation = 'source-over';
}

function togglePlay() {
    if (!isPlaying) {
        audio.play();
        isPlaying = true;
        playButton.textContent = 'PAUSE';
        // currentLyricIndex = 0;
        // inputText = '';
        // textPositions = [];
    } else {
        audio.pause();
        //audio.currentTime = 0;
        isPlaying = false;
        playButton.textContent = 'PLAY';
    }
}

function updateLyrics() {
    if (!isPlaying || !lyrics.length) return;

    const currentTime = audio.currentTime * 1000;

    if (currentLyricIndex < lyrics.length &&
        currentTime >= lyrics[currentLyricIndex].time) {
        inputText = lyrics[currentLyricIndex].text;
        generateTextPositions();
        currentLyricIndex++;
    }

    // Clear text after display duration
    if (currentLyricIndex > 0 &&
        currentTime >= lyrics[currentLyricIndex - 1].time + DISPLAY_DURATION) {
        inputText = '';
        textPositions = [];
    }
}

function generateTextPositions() {
    textPositions = [];
    const words = inputText.split(" ");
    const sectionHeight = canvas.height / words.length;
    let prevWordEnd = null;

    words.forEach((word, wordIndex) => {
        const sectionTop = sectionHeight * wordIndex;
        const sectionBottom = sectionHeight * (wordIndex + 1);

        let sectionPositions = [];
        for (let y = GRID_SPACE_Y / 2; y < canvas.height - GRID_SPACE_Y; y += GRID_SPACE_Y) {
            if (y >= sectionTop && y < sectionBottom) {
                for (let x = GRID_SPACE_X / 2; x < canvas.width - GRID_SPACE_X; x += GRID_SPACE_X) {
                    sectionPositions.push({ x, y });
                }
            }
        }

        if (sectionPositions.length === 0) return;

        let validPositions = sectionPositions.filter(pos =>
            pos.x + (word.length * GRID_SPACE_X) <= canvas.width - GRID_SPACE_X / 2
        );

        if (validPositions.length === 0) return;

        let wordPos;
        if (prevWordEnd) {
            let possiblePositions = validPositions.filter(pos => {
                let dx = Math.abs(pos.x - prevWordEnd.x);
                let dy = Math.abs(pos.y - prevWordEnd.y);
                return dx <= GRID_SPACE_X * 6 && dy >= GRID_SPACE_Y && dy <= GRID_SPACE_Y * 4;
            });

            if (possiblePositions.length > 0) {
                if (Math.random() < 0.4) {
                    let leftPositions = possiblePositions.filter(pos => pos.x < prevWordEnd.x);
                    if (leftPositions.length > 0) {
                        possiblePositions = leftPositions;
                    }
                }

                let candidates = [];
                for (let i = 0; i < Math.min(8, possiblePositions.length); i++) {
                    let randomIndex = Math.floor(Math.random() * possiblePositions.length);
                    candidates.push(possiblePositions[randomIndex]);
                    possiblePositions.splice(randomIndex, 1);
                }

                if (Math.random() < 0.6) {
                    wordPos = candidates.reduce((closest, current) => {
                        let currentDist = getDistance(current, prevWordEnd);
                        let closestDist = getDistance(closest, prevWordEnd);
                        return currentDist < closestDist ? current : closest;
                    });
                } else {
                    wordPos = candidates[Math.floor(Math.random() * candidates.length)];
                }
            } else {
                wordPos = validPositions[Math.floor(Math.random() * validPositions.length)];
            }
        } else {
            let centerPositions = validPositions.filter(pos => {
                let horizontalCenter = Math.abs(pos.x - canvas.width / 2) < canvas.width / 4;
                let nearTop = pos.y - sectionTop < sectionHeight / 3;
                return horizontalCenter && nearTop;
            });
            wordPos = centerPositions.length > 0 ?
                centerPositions[Math.floor(Math.random() * centerPositions.length)] :
                validPositions[Math.floor(Math.random() * validPositions.length)];
        }

        // Add positions for each letter with transition timing
        const now = performance.now();
        for (let i = 0; i < word.length; i++) {
            textPositions.push({
                x: wordPos.x + (i * GRID_SPACE_X),
                y: wordPos.y,
                char: word[i],
                startTime: now + Math.random() * TRANSITION_DURATION
            });
        }

        prevWordEnd = {
            x: wordPos.x + (word.length * GRID_SPACE_X),
            y: wordPos.y
        };
    });
}

function getInputLetterForPosition(x, y) {
    const now = performance.now();
    for (const pos of textPositions) {
        if (pos.x === x && pos.y === y) {
            if (now >= pos.startTime) {
                return pos.char;
            }
            return null;
        }
    }
    return null;
}

function getDistance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2)
    );
}

function gridText(x, y, forcedLetter) {
    const key = `${x},${y}`;
    if (forcedLetter) {
        letterStates.set(key, forcedLetter);
    } else if (!letterStates.has(key) || Math.random() < LETTER_CHANGE_PROBABILITY) {
        letterStates.set(key, getRandomLetter());
    }

    // Add slight pixel alignment for sharper text
    const letter = letterStates.get(key);
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Draw letter
    ctx.fillText(letter, roundedX, roundedY);
}

function getRandomLetter() {
    return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}

document.addEventListener('DOMContentLoaded', init);