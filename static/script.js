const canvas = document.getElementById("videoCanvas");
const ctx = canvas.getContext("2d");

const playPauseBtn = document.getElementById("playPause");
const seekBar = document.getElementById("seekBar");
const volumeControl = document.getElementById("volumeControl");
const fullscreenBtn = document.getElementById("fullscreen");
const resolutionSelector = document.getElementById("resolutionSelector");
const timeDisplay = document.getElementById("timeDisplay");

const videoContainer = document.querySelector(".video-container");
const controls = document.querySelector(".controls");

// Elemento de vídeo oculto para manipular quadros
const videoElement = document.createElement("video");
videoElement.src = videoSrc;
videoElement.crossOrigin = "anonymous";

// Resoluções disponíveis
const resolutions = [144, 240, 360, 480, 720, 1080, 1440, 2160];
let maxResolution = 720; // Resolução máxima do vídeo
let currentResolution = maxResolution;

// Estado do player
let isPlaying = false;

// Temporizador para ocultar controles
let controlsTimeout;

// Função para mostrar os controles
function showControls() {
    controls.style.opacity = "1";
    controls.style.pointerEvents = "all";
    resetControlsTimeout();
}

// Função para ocultar os controles
function hideControls() {
    controls.style.opacity = "0";
    controls.style.pointerEvents = "none";
}

// Redefine o temporizador para ocultar controles
function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(hideControls, 3000); // Oculta após 3 segundos
}

// Detecta a resolução máxima do vídeo ao carregar
videoElement.addEventListener("loadedmetadata", () => {
    maxResolution = Math.min(videoElement.videoHeight, 2160); // Limita a 2160p (4K)
    populateResolutionSelector();
    setResolution(maxResolution);
    console.log("Loaded metadata: video duration", videoElement.duration);
});

// Popula o seletor de resolução com base no vídeo
function populateResolutionSelector() {
    resolutionSelector.innerHTML = "";
    resolutions.forEach((res) => {
        if (res <= maxResolution) {
            const option = document.createElement("option");
            option.value = res;
            option.textContent = `${res}p`;
            if (res === maxResolution) option.selected = true;
            resolutionSelector.appendChild(option);
        }
    });
    console.log("Populated resolution selector with", resolutions);
}

// Define a resolução do canvas
function setResolution(resolution) {
    currentResolution = resolution;
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    canvas.width = resolution * aspectRatio;
    canvas.height = resolution;
    resizeCanvas();
    console.log("Set resolution to", resolution);
}

// Ajusta o tamanho do canvas no contêiner
function resizeCanvas() {
    ctx.fillStyle = "#000"; // Fundo preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log("Canvas resized to", canvas.width, canvas.height);
}

// Desenha cada quadro do vídeo no canvas
function drawFrame() {
    if (isPlaying) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
    }
}

// Alterna entre play/pause
playPauseBtn.addEventListener("click", async () => {
    try {
        if (isPlaying) {
            videoElement.pause();
            isPlaying = false;
            playPauseBtn.textContent = "▶️";
            console.log("Video paused");
        } else {
            // Evita chamar play() se o vídeo estiver no final
            if (videoElement.currentTime >= videoElement.duration) {
                console.log("Video ended, resetting currentTime");
                videoElement.currentTime = 0; // Reinicia o vídeo
            }
            console.log("Attempting to play video");
            await videoElement.play();
            isPlaying = true;
            playPauseBtn.textContent = "⏸️";
            console.log("Video is playing");
            drawFrame();
        }
    } catch (error) {
        console.error("Erro ao reproduzir o vídeo:", error);
        console.log("CurrentTime:", videoElement.currentTime, "Duration:", videoElement.duration);
    }
});

// Atualiza a barra de progresso e o tempo
videoElement.addEventListener("timeupdate", () => {
    seekBar.value = videoElement.currentTime / videoElement.duration;
    updateTimeDisplay();
    updateBuffering();
    console.log("Time updated: currentTime", videoElement.currentTime);
});

// Atualiza o buffer na barra de progresso
function updateBuffering() {
    const buffered = videoElement.buffered;
    const duration = videoElement.duration;

    if (buffered.length > 0) {
        const bufferEnd = buffered.end(buffered.length - 1);
        const bufferPercent = (bufferEnd / duration) * 100;
        seekBar.style.background = `
            linear-gradient(to right,
            #666 ${bufferPercent}%, 
            #333 ${bufferPercent}%)
        `;
        console.log("Buffered end:", bufferEnd, "Buffer percent:", bufferPercent);
    }
}

// Permite ajustar manualmente o progresso do vídeo
seekBar.addEventListener("input", () => {
    videoElement.currentTime = seekBar.value * videoElement.duration;
    console.log("Seek bar changed: currentTime", videoElement.currentTime);
});

// Controle de volume
volumeControl.addEventListener("input", () => {
    videoElement.volume = volumeControl.value;
    console.log("Volume changed to", videoElement.volume);
});

// Atualiza o display de tempo
function updateTimeDisplay() {
    const currentMinutes = Math.floor(videoElement.currentTime / 60);
    const currentSeconds = Math.floor(videoElement.currentTime % 60);
    const totalMinutes = Math.floor(videoElement.duration / 60);
    const totalSeconds = Math.floor(videoElement.duration % 60);

    timeDisplay.textContent = `${currentMinutes}:${currentSeconds < 10 ? "0" : ""}${currentSeconds} / ${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
    console.log("Updated time display:", timeDisplay.textContent);
}

// Fullscreen para o contêiner
fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
        console.log("Entered fullscreen mode");
    } else {
        document.exitFullscreen();
        console.log("Exited fullscreen mode");
    }
});

// Evento de mouse para mostrar/ocultar controles
videoContainer.addEventListener("mousemove", showControls);
videoContainer.addEventListener("mouseleave", hideControls);

// Inicializa o tamanho do canvas e controles
resizeCanvas();
resetControlsTimeout();
