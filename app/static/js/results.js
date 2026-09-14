window.renderResults = (data) => {
    const res = data.result;
    if (!res) return;

    const analysisId = data.analysis_id;

    // Report Download Links
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const downloadJsonBtn = document.getElementById("downloadJsonBtn");
    downloadPdfBtn.href = `/api/reports/${analysisId}/pdf`;
    downloadJsonBtn.href = `/api/reports/${analysisId}/json`;

    // Verdict Banner
    const finalDecisionText = document.getElementById("finalDecisionText");
    const overallScorePercent = document.getElementById("overallScorePercent");
    const targetFileInfo = document.getElementById("targetFileInfo");
    const verdictBanner = document.getElementById("verdictBanner");

    const decision = res.final_decision;
    const confidencePct = res.confidence_percent;

    finalDecisionText.textContent = decision.toUpperCase();
    overallScorePercent.textContent = `${confidencePct}%`;

    const durStr = data.duration ? ` • Duration: ${data.duration}s` : '';
    targetFileInfo.textContent = `Target: ${data.filename || 'Input Stream'} • Modality: ${data.media_type.toUpperCase()}${durStr}`;

    // Color verdict banner border
    if (decision === "Likely Fake") {
        finalDecisionText.style.color = "var(--status-danger)";
        verdictBanner.style.borderColor = "rgba(239, 68, 68, 0.4)";
    } else if (decision === "Real") {
        finalDecisionText.style.color = "var(--status-safe)";
        verdictBanner.style.borderColor = "rgba(16, 185, 129, 0.4)";
    } else {
        finalDecisionText.style.color = "var(--status-warning)";
        verdictBanner.style.borderColor = "rgba(245, 158, 11, 0.4)";
    }

    // Modality Cards
    updateScoreCard("visual", res.visual_score);
    updateScoreCard("audio", res.audio_score);
    updateScoreCard("text", res.text_score);

    // Grad-CAM Heatmap Evidence
    const heatmapGallery = document.getElementById("heatmapGallery");
    heatmapGallery.innerHTML = "";

    if (res.heatmap_paths && res.heatmap_paths.length > 0) {
        res.heatmap_paths.forEach(item => {
            const card = document.createElement("div");
            card.className = "heatmap-evidence-item";
            card.innerHTML = `
                <div class="evidence-img-row">
                    <div>
                        <span style="font-size: 0.7rem; color: var(--text-muted); display:block; margin-bottom:4px;">GRAD-CAM OVERLAY</span>
                        <img src="${item.overlay_url}" class="evidence-frame" alt="Grad-CAM Overlay">
                    </div>
                    <div>
                        <span style="font-size: 0.7rem; color: var(--text-muted); display:block; margin-bottom:4px;">ACTIVATION HEATMAP</span>
                        <img src="${item.heatmap_url}" class="evidence-frame" alt="Standalone Heatmap">
                    </div>
                </div>
                <div class="evidence-tagline">
                    <span>Timestamp: <strong>${item.timestamp}s</strong></span>
                    <span>Anomalous Activation: <strong>${(item.score * 100).toFixed(1)}%</strong></span>
                </div>
            `;
            heatmapGallery.appendChild(card);
        });
    } else {
        heatmapGallery.innerHTML = `<div class="empty-placeholder" style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">No spatial visual face frames recorded for this media modality.</div>`;
    }

    // Natural Language Explanation
    const explanationContainer = document.getElementById("explanationContainer");
    explanationContainer.innerHTML = `<p class="rationale-text">${escapeHtml(res.explanation)}</p>`;

    // Model Versions Tags
    const modelVersionsTags = document.getElementById("modelVersionsTags");
    modelVersionsTags.innerHTML = "";
    if (res.model_versions) {
        Object.entries(res.model_versions).forEach(([k, v]) => {
            const chip = document.createElement("span");
            chip.className = "version-chip";
            chip.textContent = `${k}: ${v}`;
            modelVersionsTags.appendChild(chip);
        });
    }

    // Suspicious Timeline Track
    const timelineVisualizer = document.getElementById("timelineVisualizer");
    timelineVisualizer.innerHTML = "";

    if (res.timeline_data && res.timeline_data.length > 0) {
        res.timeline_data.forEach(seg => {
            const bar = document.createElement("div");
            bar.className = `timeline-bar ${seg.is_suspicious ? 'fake' : 'safe'}`;
            const heightPct = Math.max(15, Math.round(seg.score * 100));
            bar.style.height = `${heightPct}%`;
            bar.title = `Time: ${seg.timestamp}s | Risk: ${(seg.score * 100).toFixed(1)}%`;
            timelineVisualizer.appendChild(bar);
        });
    } else {
        timelineVisualizer.innerHTML = `<div style="width: 100%; text-align: center; color: var(--text-muted); font-size: 0.8rem; line-height: 32px;">Single-point evaluation (no continuous stream timeline).</div>`;
    }

    // Feedback Mechanism Setup
    setupFeedback(analysisId);
};

function updateScoreCard(modality, score) {
    const valElem = document.getElementById(`${modality}ScoreVal`);
    const classElem = document.getElementById(`${modality}ScoreClass`);
    const barElem = document.getElementById(`${modality}ScoreBar`);

    if (score === null || score === undefined) {
        valElem.textContent = "N/A";
        classElem.textContent = "NOT APPLICABLE";
        classElem.style.color = "var(--text-muted)";
        barElem.style.width = "0%";
        barElem.className = "meter-fill";
        return;
    }

    valElem.textContent = `${(score * 100).toFixed(1)}%`;
    barElem.style.width = `${Math.min(100, Math.max(5, score * 100))}%`;
    barElem.className = "meter-fill";

    if (score >= 0.65) {
        classElem.textContent = "HIGH RISK";
        classElem.style.color = "var(--status-danger)";
        barElem.classList.add("danger");
    } else if (score >= 0.35) {
        classElem.textContent = "SUSPICIOUS";
        classElem.style.color = "var(--status-warning)";
        barElem.classList.add("warning");
    } else {
        classElem.textContent = "NATURAL";
        classElem.style.color = "var(--status-safe)";
        barElem.classList.add("safe");
    }
}

function setupFeedback(analysisId) {
    const fbCorrect = document.getElementById("feedbackCorrectBtn");
    const fbIncorrect = document.getElementById("feedbackIncorrectBtn");
    const fbForm = document.getElementById("feedbackForm");
    const fbComment = document.getElementById("feedbackComment");
    const submitFb = document.getElementById("submitFeedbackBtn");
    const fbThanks = document.getElementById("feedbackThankYou");

    fbForm.classList.add("hidden");
    fbThanks.classList.add("hidden");

    let isCorrectChoice = null;

    fbCorrect.onclick = () => {
        isCorrectChoice = true;
        fbForm.classList.remove("hidden");
        fbCorrect.style.borderColor = "var(--status-safe)";
        fbIncorrect.style.borderColor = "var(--border-color)";
    };

    fbIncorrect.onclick = () => {
        isCorrectChoice = false;
        fbForm.classList.remove("hidden");
        fbIncorrect.style.borderColor = "var(--status-danger)";
        fbCorrect.style.borderColor = "var(--border-color)";
    };

    submitFb.onclick = async () => {
        if (isCorrectChoice === null) return;
        try {
            await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysis_id: analysisId,
                    is_correct: isCorrectChoice,
                    user_comment: fbComment.value.trim() || null
                })
            });
            fbForm.classList.add("hidden");
            fbThanks.classList.remove("hidden");
        } catch (e) {
            console.error("Feedback submit error", e);
        }
    };
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
