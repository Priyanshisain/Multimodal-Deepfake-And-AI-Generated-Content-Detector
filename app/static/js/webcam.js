document.addEventListener("DOMContentLoaded", () => {
    const startWebcamBtn = document.getElementById("startWebcamBtn");
    const stopWebcamBtn = document.getElementById("stopWebcamBtn");
    const videoElem = document.getElementById("webcamVideo");
    const overlayCanvas = document.getElementById("webcamOverlayCanvas");
    const cameraPlaceholder = document.getElementById("cameraPlaceholder");
    const liveHeatmapImg = document.getElementById("liveHeatmapImg");

    const liveDecisionBadge = document.getElementById("liveDecisionBadge");
    const liveConfidenceVal = document.getElementById("liveConfidenceVal");
    const liveMeterBar = document.getElementById("liveMeterBar");
    const liveFacesCount = document.getElementById("liveFacesCount");
    const liveLatency = document.getElementById("liveLatency");
    const liveAnomaliesList = document.getElementById("liveAnomaliesList");
    const webcamFps = document.getElementById("webcamFps");

    let stream = null;
    let isAnalyzing = false;
    let loopTimeout = null;
    let frameCount = 0;
    let fpsTimer = null;

    startWebcamBtn.addEventListener("click", async () => {
        if (window.isGuestLimitReached && window.isGuestLimitReached()) {
            window.showGuestLimitModal(false);
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            videoElem.srcObject = stream;
            cameraPlaceholder.classList.add("hidden");
            startWebcamBtn.classList.add("hidden");
            stopWebcamBtn.classList.remove("hidden");

            videoElem.onloadedmetadata = () => {
                overlayCanvas.width = videoElem.videoWidth;
                overlayCanvas.height = videoElem.videoHeight;
                isAnalyzing = true;
                frameCount = 0;
                fpsTimer = setInterval(() => {
                    webcamFps.textContent = `${frameCount} FPS`;
                    frameCount = 0;
                }, 1000);
                captureAndAnalyze();
            };
        } catch (err) {
            alert(`Unable to access webcam: ${err.message}. Please check browser permissions.`);
        }
    });

    stopWebcamBtn.addEventListener("click", stopCamera);

    function stopCamera() {
        isAnalyzing = false;
        if (loopTimeout) clearTimeout(loopTimeout);
        if (fpsTimer) clearInterval(fpsTimer);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        videoElem.srcObject = null;
        cameraPlaceholder.classList.remove("hidden");
        startWebcamBtn.classList.remove("hidden");
        stopWebcamBtn.classList.add("hidden");

        const ctx = overlayCanvas.getContext("2d");
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        webcamFps.textContent = "0 FPS";
    }

    async function captureAndAnalyze() {
        if (!isAnalyzing || !videoElem.videoWidth) return;

        const offscreen = document.createElement("canvas");
        offscreen.width = videoElem.videoWidth;
        offscreen.height = videoElem.videoHeight;
        const ctx = offscreen.getContext("2d");
        ctx.drawImage(videoElem, 0, 0, offscreen.width, offscreen.height);

        const b64Image = offscreen.toDataURL("image/jpeg", 0.7);
        const startTime = performance.now();

        try {
            const resp = await fetch("/api/webcam/analyze_frame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_base64: b64Image })
            });

            if (resp.ok) {
                const data = await resp.json();
                const latency = Math.round(performance.now() - startTime);
                updateLiveTelemetry(data, latency);
                frameCount++;
            }
        } catch (err) {
            console.error("Webcam frame inference error:", err);
        }

        // Target ~3 to 4 frame inferences per second for responsive real-time analysis
        if (isAnalyzing) {
            loopTimeout = setTimeout(captureAndAnalyze, 250);
        }
    }

    function updateLiveTelemetry(data, latency) {
        liveConfidenceVal.textContent = `${data.confidence_percent}%`;
        liveFacesCount.textContent = data.faces_count;
        liveLatency.textContent = `${latency} ms`;

        const liveFaceQuality = document.getElementById("liveFaceQuality");
        if (liveFaceQuality) {
            liveFaceQuality.textContent = data.quality_score !== undefined ? `${Math.round(data.quality_score * 100)}%` : "--";
        }

        // Update Heatmap
        if (data.heatmap_frame) {
            liveHeatmapImg.src = data.heatmap_frame;
        }

        // Decision Badge & Meter Color
        const score = data.score;
        liveMeterBar.style.width = `${Math.min(100, Math.max(5, score * 100))}%`;
        liveMeterBar.className = "meter-fill";

        if (data.decision === "Likely Fake") {
            liveDecisionBadge.textContent = "LIKELY FAKE";
            liveDecisionBadge.className = "mini-badge fake";
            liveMeterBar.classList.add("danger");
        } else if (data.decision === "Real") {
            liveDecisionBadge.textContent = "AUTHENTIC";
            liveDecisionBadge.className = "mini-badge real";
            liveMeterBar.classList.add("safe");
        } else {
            liveDecisionBadge.textContent = "SUSPICIOUS";
            liveDecisionBadge.className = "mini-badge suspicious";
            liveMeterBar.classList.add("warning");
        }

        // Draw Bounding Boxes on Overlay Canvas
        const ctx = overlayCanvas.getContext("2d");
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (data.bounding_boxes && data.bounding_boxes.length > 0) {
            data.bounding_boxes.forEach(([x, y, w, h]) => {
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = score >= 0.6 ? "#ef4444" : "#10b981";
                ctx.strokeRect(x, y, w, h);

                ctx.fillStyle = score >= 0.6 ? "#ef4444" : "#10b981";
                ctx.font = "bold 13px JetBrains Mono, monospace";
                ctx.fillText(`Fake: ${(score * 100).toFixed(1)}%`, x, Math.max(18, y - 6));
            });
        }

        // Detected signatures list
        if (data.anomalies && data.anomalies.length > 0) {
            liveAnomaliesList.innerHTML = data.anomalies.map(a => `<li>${a}</li>`).join("");
        }
    }
});
