document.addEventListener("DOMContentLoaded", () => {
    const sounds = {
        tom: document.getElementById("tAudio"),
        clap: document.getElementById("cAudio"),
        kick: document.getElementById("kAudio"),
        hat: document.getElementById("oAudio"),
        boom: document.getElementById("bAudio"),
        ride: document.getElementById("rAudio"),
        snare: document.getElementById("sAudio"),
    };

    // Shuffle the keys of the sounds object
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    const shuffledKeys = shuffleArray(Object.keys(sounds));

    let audioContext;
    const soundNodes = {};

    const initializeAudioContext = () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            shuffledKeys.forEach((key) => {
                const source = audioContext.createMediaElementSource(sounds[key]);
                const gainNode = audioContext.createGain();
                const reverbNode = audioContext.createConvolver();
                const reverbGainNode = audioContext.createGain();
                const delayNode = audioContext.createDelay();
                const delayGainNode = audioContext.createGain();
                const delayToReverbGainNode = audioContext.createGain();
                const cleanDelayGainNode = audioContext.createGain();
                const wetGainNode = audioContext.createGain();
                const dryGainNode = audioContext.createGain();

                // Load a reverb sample
                fetch('http://reverbjs.org/Library/ArbroathAbbeySacristy.m4a')
                    .then(response => response.arrayBuffer())
                    .then(data => audioContext.decodeAudioData(data))
                    .then(buffer => reverbNode.buffer = buffer);

                source.connect(gainNode);
                gainNode.connect(dryGainNode);
                gainNode.connect(delayNode);
                delayNode.connect(delayGainNode);
                delayGainNode.connect(delayToReverbGainNode);
                delayGainNode.connect(cleanDelayGainNode);
                delayToReverbGainNode.connect(reverbNode);
                cleanDelayGainNode.connect(wetGainNode);
                gainNode.connect(reverbNode);
                reverbNode.connect(reverbGainNode);
                reverbGainNode.connect(wetGainNode);
                wetGainNode.connect(audioContext.destination);
                dryGainNode.connect(audioContext.destination);

                // Initialize gains
                reverbGainNode.gain.value = 0;
                cleanDelayGainNode.gain.value = 1;
                delayToReverbGainNode.gain.value = 0;
                delayNode.delayTime.value = 1;
                delayGainNode.gain.value = 0;
                dryGainNode.gain.value = 0.5;
                wetGainNode.gain.value = 0.5;

                soundNodes[key] = { gainNode, reverbNode, reverbGainNode, delayNode, delayGainNode, wetGainNode, dryGainNode, delayToReverbGainNode, cleanDelayGainNode };
            });
        }
    };

    const grid = document.querySelector(".grid");

    shuffledKeys.forEach((key) => {
        const column = document.createElement("div");
        column.classList.add("column");

        const trackName = document.createElement("div");
        trackName.classList.add("track-name");
        trackName.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Dynamically assign track names based on shuffle
        column.appendChild(trackName);

        const gearIcon = document.createElement("span");
        gearIcon.classList.add("gear-icon");
        gearIcon.innerHTML = "&#9881;";
        column.appendChild(gearIcon);

        const effectsPanel = document.createElement("div");
        effectsPanel.classList.add("effects-panel");

        // Reverb control
        const reverbLabel = document.createElement("label");
        reverbLabel.textContent = "Reverb";
        const reverbSlider = document.createElement("input");
        reverbSlider.type = "range";
        reverbSlider.min = 0;
        reverbSlider.max = 100;
        reverbSlider.value = 0;
        reverbSlider.addEventListener("input", () => {
            const wetLevel = reverbSlider.value / 100;
            soundNodes[key].reverbGainNode.gain.value = wetLevel;
            soundNodes[key].cleanDelayGainNode.gain.value = 1 - wetLevel;
            soundNodes[key].delayToReverbGainNode.gain.value = wetLevel;
        });
        effectsPanel.appendChild(reverbLabel);
        effectsPanel.appendChild(reverbSlider);

        // Delay control
        const delayLabel = document.createElement("label");
        delayLabel.textContent = "Delay";
        const delaySlider = document.createElement("input");
        delaySlider.type = "range";
        delaySlider.min = 0;
        delaySlider.max = 100;
        delaySlider.value = 0;
        delaySlider.addEventListener("input", () => {
            soundNodes[key].delayNode.delayTime.value = 1;
            soundNodes[key].delayGainNode.gain.value = delaySlider.value / 100;
        });
        effectsPanel.appendChild(delayLabel);
        effectsPanel.appendChild(delaySlider);

        // Dry/Wet mix control
        const mixLabel = document.createElement("label");
        mixLabel.textContent = "Dry/Wet Mix";
        const mixSlider = document.createElement("input");
        mixSlider.type = "range";
        mixSlider.min = 0;
        mixSlider.max = 100;
        mixSlider.value = 50;
        mixSlider.addEventListener("input", () => {
            const mixValue = mixSlider.value / 100;
            soundNodes[key].dryGainNode.gain.value = 1 - mixValue;
            soundNodes[key].wetGainNode.gain.value = mixValue;
        });
        effectsPanel.appendChild(mixLabel);
        effectsPanel.appendChild(mixSlider);

        // Enable effects checkbox
        const effectEnable = document.createElement("input");
        effectEnable.type = "checkbox";
        effectEnable.checked = true;
        const effectEnableLabel = document.createElement("label");
        effectEnableLabel.textContent = "Enable Effects";
        effectsPanel.appendChild(effectEnable);
        effectsPanel.appendChild(effectEnableLabel);

        effectEnable.addEventListener("change", () => {
            if (effectEnable.checked) {
                soundNodes[key].wetGainNode.gain.value = mixSlider.value / 100;
            } else {
                soundNodes[key].wetGainNode.gain.value = 0;
            }
        });

        column.appendChild(effectsPanel);

        for (let i = 0; i < 8; i++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.addEventListener("click", () => {
                square.classList.toggle("play");
                initializeAudioContext();
            });
            column.appendChild(square);
        }

        grid.appendChild(column);

        gearIcon.addEventListener("click", () => {
            effectsPanel.classList.toggle("open");
            initializeAudioContext();
        });
    });

    // Tempo Slider
    const tempoSlider = document.getElementById("tempo");
    const tempoValueDisplay = document.getElementById("tempoValue");
    let tempo = tempoSlider.value;

    tempoSlider.addEventListener("input", (e) => {
        tempo = e.target.value;
        tempoValueDisplay.textContent = tempo;
    });

    // Play/Stop functionality
    const playBtn = document.querySelector(".play");
    const stopBtn = document.querySelector(".stop");
    const columns = document.querySelectorAll(".column");
    let isPlaying = false;
    let interval;

    const playGrid = () => {
        let step = 0;
        const timing = (60 / tempo) * 1000;

        interval = setInterval(() => {
            columns.forEach((column, index) => {
                const squares = column.querySelectorAll(".square");
                squares.forEach((square, i) => {
                    square.classList.toggle("active-btn", i === step);
                    if (i === step && square.classList.contains("play")) {
                        const sound = sounds[shuffledKeys[index]]; // Map sound dynamically to shuffled order
                        sound.currentTime = 0;
                        sound.play();
                    }
                });
            });
            step = (step + 1) % 8;
        }, timing);
    };

    playBtn.addEventListener("click", () => {
        if (isPlaying) return;
        initializeAudioContext();
        isPlaying = true;
        playGrid();
        playBtn.classList.add("hidden");
        stopBtn.classList.remove("hidden");
    });

    stopBtn.addEventListener("click", () => {
        clearInterval(interval);
        isPlaying = false;
        playBtn.classList.remove("hidden");
        stopBtn.classList.add("hidden");
        columns.forEach((column) => {
            column.querySelectorAll(".square").forEach((square) => square.classList.remove("active-btn"));
        });
    });

    // Reset functionality
    const resetBtn = document.querySelector(".reset");
    resetBtn.addEventListener("click", () => {
        columns.forEach((column) => {
            column.querySelectorAll(".square").forEach((square) => square.classList.remove("play"));
        });
    });
});
