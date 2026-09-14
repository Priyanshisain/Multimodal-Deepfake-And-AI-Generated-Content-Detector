document.addEventListener("DOMContentLoaded", () => {
    const historyTableBody = document.getElementById("historyTableBody");
    const historyTableCard = document.getElementById("historyTableCard");
    const historyAuthPrompt = document.getElementById("historyAuthPrompt");
    const historySignInBtn = document.getElementById("historySignInBtn");

    const filterMediaType = document.getElementById("filterMediaType");
    const filterDecision = document.getElementById("filterDecision");
    const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");

    if (historySignInBtn) {
        historySignInBtn.addEventListener("click", () => {
            const authModal = document.getElementById("authModal");
            if (authModal) authModal.classList.remove("hidden");
        });
    }

    window.loadHistory = async () => {
        const token = window.getAuthToken ? window.getAuthToken() : null;

        if (!token) {
            // Unauthenticated state: show prompt, hide table
            if (historyAuthPrompt) historyAuthPrompt.classList.remove("hidden");
            if (historyTableCard) historyTableCard.classList.add("hidden");
            return;
        }

        if (historyAuthPrompt) historyAuthPrompt.classList.add("hidden");
        if (historyTableCard) historyTableCard.classList.remove("hidden");
        historyTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading your analysis records...</td></tr>`;

        const params = new URLSearchParams();
        if (filterMediaType.value) params.append("media_type", filterMediaType.value);
        if (filterDecision.value) params.append("decision", filterDecision.value);

        try {
            const resp = await fetch(`/api/history?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (resp.status === 401) {
                if (window.clearAuthSession) window.clearAuthSession();
                if (historyAuthPrompt) historyAuthPrompt.classList.remove("hidden");
                if (historyTableCard) historyTableCard.classList.add("hidden");
                return;
            }

            if (!resp.ok) throw new Error("Failed to load history registry");
            const data = await resp.json();

            if (!data.items || data.items.length === 0) {
                historyTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">No analysis records found under your account yet.</td></tr>`;
                return;
            }

            historyTableBody.innerHTML = data.items.map(item => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : '--';
                const dec = item.final_decision || 'Pending';
                let badgeClass = 'suspicious';
                if (dec === 'Likely Fake') badgeClass = 'fake';
                if (dec === 'Real') badgeClass = 'safe';

                const confStr = item.fused_score !== null ? `${(item.fused_score * 100).toFixed(1)}%` : '--';

                return `
                    <tr>
                        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">${item.analysis_id.substring(0, 8)}...</td>
                        <td style="font-weight: 500;">${item.original_filename}</td>
                        <td style="text-transform: uppercase; font-size: 0.75rem; font-weight: 600;">${item.media_type}</td>
                        <td><span class="status-badge ${badgeClass}">${dec.toUpperCase()}</span></td>
                        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${confStr}</td>
                        <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
                        <td>
                            <div style="display: flex; gap: 0.4rem;">
                                <button class="btn-action small" onclick="viewHistoryCase('${item.analysis_id}')">View</button>
                                <a class="btn-action small secondary" href="/api/reports/${item.analysis_id}/pdf" target="_blank">PDF</a>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

        } catch (err) {
            historyTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color: var(--status-danger);">Error fetching history: ${err.message}</td></tr>`;
        }
    };

    filterMediaType.addEventListener("change", window.loadHistory);
    filterDecision.addEventListener("change", window.loadHistory);
    refreshHistoryBtn.addEventListener("click", window.loadHistory);

    window.viewHistoryCase = async (analysisId) => {
        try {
            const token = window.getAuthToken ? window.getAuthToken() : null;
            const headers = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const resp = await fetch(`/api/history/${analysisId}`, { headers });
            if (!resp.ok) throw new Error("Could not load case details");
            const data = await resp.json();
            window.renderResults(data);
            window.switchTab("results-tab");
        } catch (e) {
            alert(`Error loading case: ${e.message}`);
        }
    };
});
