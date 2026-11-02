/* =========================================================
   Echo Path - Chatbot Custom AI Report Bridge
   ADD-ON ONLY
   - 기존 learning-chatbot.js 수정 없음
   - 기존 app.js 수정 없음
   - 기존 자동 AI 분석(ai_analysis) 수정/삭제 없음
   - 오늘 저장된 맞춤 분석이 있을 때만 리포트 표시값을 덮어보여 줌
========================================================= */

import { supabase } from "./supabase.js";

const CUSTOM_TABLE = "ai_analysis_custom";
const CUSTOM_IDS = {
    core: "#reportCoreAnalysis",
    meta: "#reportAiAnalysisMeta",
    learning: "#reportLearningDirection",
    solution: "#reportSolutionSuggestions",
    patternTitle: "#reportPatternTitle",
    patternDescription: "#reportPatternDescription"
};

let customAnalysis = null;
let currentUserId = null;
let applying = false;
let reportObserver = null;
let chatObserver = null;
let refreshTimer = null;
let refinementMode = false;

function safeText(value) {
    return String(value ?? "").trim();
}

function isRelevantPersonalAnalysis(userText, assistantText) {
    const text = `${userText}\n${assistantText}`;
    return /(내\s*(결과|기록|데이터|패턴|사용|집중|습관|공부|학습)|오늘의\s*AI\s*분석|리포트|DDI|T\s*\/\s*N\s*\/\s*C\s*\/\s*R|앱\s*(사용|전환)|집중\s*(패턴|상태)|사용\s*습관|공부\s*방법|학습\s*방법)/i.test(text);
}

function injectStyles() {
    if (document.querySelector("#echoCustomAnalysisStyles")) return;

    const style = document.createElement("style");
    style.id = "echoCustomAnalysisStyles";
    style.textContent = `
        .echo-custom-report-control{
            margin-top:14px;padding:14px;border:1px solid #dbe4ff;
            border-radius:14px;background:#f8faff;display:flex;
            flex-wrap:wrap;gap:8px;align-items:center;
        }
        .echo-custom-report-copy{flex:1 1 220px;min-width:0}
        .echo-custom-report-copy strong{display:block;font-size:14px;color:#1f2a44}
        .echo-custom-report-copy span{display:block;margin-top:4px;font-size:12px;color:#667085;line-height:1.45}
        .echo-custom-report-button{
            border:0;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;
            cursor:pointer;background:#3867f4;color:#fff;
        }
        .echo-custom-report-button.danger{background:#fff0f0;color:#b42318}
        .echo-custom-badge{
            display:inline-flex;align-items:center;margin-left:8px;padding:4px 8px;
            border-radius:999px;background:#eaf0ff;color:#3157c8;font-size:11px;font-weight:800;
        }
        .echo-custom-apply{
            margin-top:8px;border:1px solid #cfd9ff;background:#f7f9ff;color:#3157c8;
            border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800;cursor:pointer;
        }
        .echo-custom-apply[disabled]{opacity:.55;cursor:default}
        .echo-custom-status{width:100%;font-size:11px;color:#667085;margin:2px 0 0}
    `;
    document.head.appendChild(style);
}

function setStatus(message, kind = "") {
    const status = document.querySelector("#echoCustomAnalysisStatus");
    if (!status) return;

    status.textContent = message || "";
    status.dataset.state = kind;
    if (kind === "error") status.style.color = "#b42318";
    else if (kind === "success") status.style.color = "#067647";
    else status.style.color = "#667085";
}

function openChatForRefinement() {
    const panel = document.querySelector("#echoChatPanel");
    const launcher = document.querySelector("#echoChatLauncher");
    const mainView = document.querySelector("#echoChatMainView");
    const historyView = document.querySelector("#echoChatHistoryView");
    const input = document.querySelector("#echoChatInput");

    if (!panel || !input) {
        alert("AI 학습 도우미가 아직 준비되지 않았습니다.");
        return;
    }

    refinementMode = true;

    panel.hidden = false;
    if (launcher) launcher.hidden = true;
    if (mainView) mainView.hidden = false;
    if (historyView) historyView.hidden = true;

    /*
       중요: 사용자가 직접 질문하도록 입력창을 비워 둡니다.
       v2에서 자동으로 넣었던 안내 문구가 남아 있는 경우에만 제거합니다.
       사용자가 직접 작성 중인 다른 문장은 지우지 않습니다.
    */
    const oldInjectedPrefix = "오늘의 AI 분석 결과가 나에게 잘 맞는지 함께 다시 분석해줘.";
    if (String(input.value ?? "").trim().startsWith(oldInjectedPrefix)) {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    input.focus();
}
function ensureReportControl() {
    const card = document.querySelector(".report-ai-detail-card");
    if (!card || document.querySelector("#echoCustomReportControl")) return;

    const control = document.createElement("div");
    control.className = "echo-custom-report-control";
    control.id = "echoCustomReportControl";
    control.innerHTML = `
        <div class="echo-custom-report-copy">
            <strong>
                챗봇과 함께 맞춤 분석
                <span id="echoCustomAnalysisBadge" class="echo-custom-badge" hidden>맞춤 분석 적용됨</span>
            </strong>
            <span>
                자동 분석이 내 상황과 다르면 챗봇과 대화한 뒤,
                원하는 답변을 오늘의 AI 분석에 반영할 수 있습니다.
            </span>
        </div>
        <button id="echoRefineAnalysis" class="echo-custom-report-button" type="button">
            챗봇과 더 분석하기
        </button>
        <button id="echoResetCustomAnalysis" class="echo-custom-report-button danger" type="button" hidden>
            자동 분석으로 되돌리기
        </button>
        <p id="echoCustomAnalysisStatus" class="echo-custom-status" aria-live="polite"></p>
    `;

    card.appendChild(control);

    control.querySelector("#echoRefineAnalysis")?.addEventListener(
        "click",
        openChatForRefinement
    );

    control.querySelector("#echoResetCustomAnalysis")?.addEventListener(
        "click",
        () => void resetCustomAnalysis()
    );

    syncControlState();
}

function syncControlState() {
    const badge = document.querySelector("#echoCustomAnalysisBadge");
    const reset = document.querySelector("#echoResetCustomAnalysis");

    if (badge) badge.hidden = !customAnalysis;
    if (reset) reset.hidden = !customAnalysis;
}

function applyCustomToReport() {
    if (!customAnalysis || applying) return;

    applying = true;
    try {
        const updates = [
            [CUSTOM_IDS.core, customAnalysis.summary],
            [CUSTOM_IDS.meta, `맞춤 분석 · ${customAnalysis.analysis_date || "오늘"}`],
            [CUSTOM_IDS.learning, customAnalysis.learning_direction],
            [CUSTOM_IDS.solution, customAnalysis.solution_suggestions],
            [CUSTOM_IDS.patternTitle, "챗봇 대화를 반영한 이용 습관"],
            [CUSTOM_IDS.patternDescription, customAnalysis.habit_pattern]
        ];

        for (const [selector, value] of updates) {
            const element = document.querySelector(selector);
            const next = safeText(value);
            if (element && next && element.textContent !== next) {
                element.textContent = next;
            }
        }

        syncControlState();
    } finally {
        window.setTimeout(() => {
            applying = false;
        }, 0);
    }
}

function collectCurrentConversationMessages() {
    const result = [];
    document.querySelectorAll("#echoChatMessages .echo-chat-msg").forEach((wrapper) => {
        const bubble = wrapper.querySelector(".echo-chat-bubble");
        if (!bubble) return;

        const content = safeText(bubble.textContent);
        if (!content || wrapper.querySelector(".echo-chat-typing")) return;

        const role = wrapper.classList.contains("user")
            ? "user"
            : "assistant";

        result.push({ role, content });
    });
    return result.slice(-20);
}

async function saveAssistantReply(button, text) {
    if (!text || !currentUserId) return;

    if (!confirm("이 챗봇 답변을 오늘의 AI 분석에 반영할까요?\n\nT/N/C/R·DDI 원본 수치는 변경되지 않습니다.")) {
        return;
    }

    button.disabled = true;
    const original = button.textContent;
    button.textContent = "반영 중...";

    try {
        const analysisDate = new Intl.DateTimeFormat(
            "en-CA",
            { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }
        ).format(new Date());

        /*
           추가 Gemini 호출을 하지 않습니다.
           이미 챗봇이 사용자와 대화해 만든 최종 답변을 맞춤 핵심 분석으로 저장합니다.
           나머지 리포트 항목은 현재 자동 분석 결과를 그대로 보존합니다.
        */
        const habitPattern =
            safeText(document.querySelector(CUSTOM_IDS.patternDescription)?.textContent)
            || text;

        const learningDirection =
            safeText(document.querySelector(CUSTOM_IDS.learning)?.textContent)
            || text;

        const solutionSuggestions =
            safeText(document.querySelector(CUSTOM_IDS.solution)?.textContent)
            || text;

        const payload = {
            user_id: currentUserId,
            analysis_date: analysisDate,
            source_chat_text: text,
            summary: text,
            habit_pattern: habitPattern,
            learning_direction: learningDirection,
            solution_suggestions: solutionSuggestions,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(CUSTOM_TABLE)
            .upsert(payload, { onConflict: "user_id,analysis_date" })
            .select("id,analysis_date,summary,habit_pattern,learning_direction,solution_suggestions,source_chat_text,created_at,updated_at")
            .single();

        if (error) throw error;
        if (!data) throw new Error("맞춤 분석 저장 결과를 확인하지 못했습니다.");

        customAnalysis = data;
        ensureReportControl();
        applyCustomToReport();
        syncControlState();
        setStatus("선택한 챗봇 답변을 오늘의 AI 분석에 반영했습니다.", "success");

        button.textContent = "오늘의 AI 분석에 반영됨";
    } catch (error) {
        console.error("Echo Path 맞춤 분석 저장 실패:", error);
        const message = error?.message || "맞춤 분석 저장에 실패했습니다.";
        alert(`맞춤 분석 저장에 실패했습니다.\n\n${message}`);
        button.disabled = false;
        button.textContent = original;
    }
}
function decorateAssistantMessages() {
    const wrappers = [
        ...document.querySelectorAll("#echoChatMessages .echo-chat-msg")
    ];

    let lastUserText = "";

    wrappers.forEach((wrapper) => {
        const bubble = wrapper.querySelector(".echo-chat-bubble");
        if (!bubble) return;

        const text = safeText(bubble.textContent);

        if (wrapper.classList.contains("user")) {
            lastUserText = text;
            return;
        }

        if (!wrapper.classList.contains("assistant")) return;
        if (wrapper.querySelector(".echo-chat-typing, .echo-chat-error")) return;
        if (wrapper.querySelector(".echo-custom-apply")) return;
        if (!refinementMode && !isRelevantPersonalAnalysis(lastUserText, text)) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "echo-custom-apply";
        button.textContent = "오늘의 AI 분석에 반영";
        button.addEventListener(
            "click",
            () => void saveAssistantReply(button, text)
        );

        wrapper.appendChild(button);
    });
}

async function loadCustomAnalysis() {
    if (!currentUserId) {
        customAnalysis = null;
        syncControlState();
        return;
    }

    try {
        const analysisDate = new Intl.DateTimeFormat(
            "en-CA",
            { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }
        ).format(new Date());

        const { data, error } = await supabase
            .from(CUSTOM_TABLE)
            .select("id,analysis_date,summary,habit_pattern,learning_direction,solution_suggestions,source_chat_text,created_at,updated_at")
            .eq("user_id", currentUserId)
            .eq("analysis_date", analysisDate)
            .maybeSingle();

        if (error) throw error;

        customAnalysis = data ?? null;
        ensureReportControl();
        syncControlState();
        applyCustomToReport();

        if (customAnalysis) {
            setStatus("오늘은 챗봇 대화를 반영한 맞춤 분석이 표시되고 있습니다.", "success");
        }
    } catch (error) {
        // 맞춤 분석 테이블 문제로 기존 Echo Path가 멈추지 않도록 실패를 격리합니다.
        console.warn("Echo Path 맞춤 분석 불러오기 대기:", error?.message || error);
    }
}
async function resetCustomAnalysis() {
    if (!customAnalysis || !currentUserId) return;

    if (!confirm("오늘의 맞춤 분석을 해제하고 기존 자동 AI 분석으로 되돌릴까요?\n\n원래 자동 분석 데이터는 삭제되지 않습니다.")) {
        return;
    }

    setStatus("자동 분석으로 되돌리는 중...");

    try {
        const analysisDate = new Intl.DateTimeFormat(
            "en-CA",
            { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }
        ).format(new Date());

        const { error } = await supabase
            .from(CUSTOM_TABLE)
            .delete()
            .eq("user_id", currentUserId)
            .eq("analysis_date", analysisDate);

        if (error) throw error;

        customAnalysis = null;
        syncControlState();
        setStatus("맞춤 분석을 해제했습니다. 기존 자동 분석을 다시 표시합니다.", "success");

        // 기존 app.js의 원래 렌더링을 그대로 사용하기 위해 새로고침만 수행합니다.
        window.setTimeout(() => window.location.reload(), 350);
    } catch (error) {
        console.error("Echo Path 맞춤 분석 해제 실패:", error);
        setStatus(error?.message || "맞춤 분석 해제에 실패했습니다.", "error");
    }
}
function scheduleApply() {
    if (refreshTimer) window.clearTimeout(refreshTimer);

    refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        ensureReportControl();
        decorateAssistantMessages();
        applyCustomToReport();
    }, 30);
}

function startObservers() {
    if (!reportObserver) {
        const reportPage = document.querySelector("#reportPage");
        if (reportPage) {
            reportObserver = new MutationObserver(() => {
                if (!applying) scheduleApply();
            });
            reportObserver.observe(reportPage, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    if (!chatObserver) {
        const chatMessages = document.querySelector("#echoChatMessages");
        if (chatMessages) {
            chatObserver = new MutationObserver(scheduleApply);
            chatObserver.observe(chatMessages, {
                childList: true,
                subtree: true
            });
        }
    }
}

async function initializeForSession(session) {
    currentUserId = session?.user?.id ?? null;
    customAnalysis = null;

    injectStyles();
    ensureReportControl();
    startObservers();
    decorateAssistantMessages();

    await loadCustomAnalysis();
}

const { data: sessionData } = await supabase.auth.getSession();
await initializeForSession(sessionData?.session ?? null);

supabase.auth.onAuthStateChange((_event, session) => {
    void initializeForSession(session);
});

window.addEventListener("focus", () => {
    scheduleApply();
});
