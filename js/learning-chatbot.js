/* =========================================================
   Echo Path Learning Chatbot - Conversation History Edition
   - 기존 app.js와 독립 동작
   - Supabase Edge Function: learning-chat
   - 계정별 다중 대화 기록(localStorage)
   - 대화목록 / 새 대화 / 이어하기 / 개별 삭제
   - 기존 단일 대화 저장값 자동 마이그레이션
========================================================= */

import { supabase } from "./supabase.js";

const FUNCTION_NAME = "learning-chat";

const LEGACY_STORE_PREFIX = "echoPathLearningChat";
const HISTORY_STORE_PREFIX = "echoPathLearningChatHistory";
const ACTIVE_STORE_PREFIX = "echoPathLearningChatActive";
const POSITION_STORAGE_KEY = "echoPathLearningChatPosition";

const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 160;

let currentUserId = "guest";
let conversations = [];
let activeConversationId = null;
let isSending = false;

let launcherDragging = false;
let launcherMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let launcherStartLeft = 0;
let launcherStartTop = 0;


/* =========================================================
   Storage helpers
========================================================= */

function historyStorageKey() {
    return `${HISTORY_STORE_PREFIX}_${currentUserId}`;
}

function activeStorageKey() {
    return `${ACTIVE_STORE_PREFIX}_${currentUserId}`;
}

function legacyStorageKey() {
    return `${LEGACY_STORE_PREFIX}_${currentUserId}`;
}

function createConversation() {
    const now = new Date().toISOString();

    return {
        id:
            globalThis.crypto?.randomUUID?.()
            ?? `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: "새 대화",
        createdAt: now,
        updatedAt: now,
        messages: []
    };
}

function normalizeConversation(item) {
    if (!item || typeof item !== "object") return null;

    const messages =
        Array.isArray(item.messages)
            ? item.messages
                .filter(
                    (message) =>
                        message
                        &&
                        (
                            message.role === "user"
                            ||
                            message.role === "assistant"
                        )
                        &&
                        typeof message.content === "string"
                )
                .slice(-MAX_MESSAGES_PER_CONVERSATION)
            : [];

    return {
        id:
            String(
                item.id
                || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
            ),
        title:
            String(item.title || "새 대화"),
        createdAt:
            String(item.createdAt || new Date().toISOString()),
        updatedAt:
            String(item.updatedAt || item.createdAt || new Date().toISOString()),
        messages
    };
}

function loadHistory() {
    try {
        const raw =
            localStorage.getItem(
                historyStorageKey()
            );

        const parsed =
            raw
                ? JSON.parse(raw)
                : [];

        conversations =
            Array.isArray(parsed)
                ? parsed
                    .map(normalizeConversation)
                    .filter(Boolean)
                    .sort(
                        (a, b) =>
                            new Date(b.updatedAt).getTime()
                            -
                            new Date(a.updatedAt).getTime()
                    )
                    .slice(0, MAX_CONVERSATIONS)
                : [];
    }
    catch (error) {
        console.warn("AI 학습 도우미 대화목록 불러오기 실패:", error);
        conversations = [];
    }
}

function migrateLegacyConversationIfNeeded() {
    if (conversations.length > 0) return;

    try {
        const raw =
            localStorage.getItem(
                legacyStorageKey()
            );

        if (!raw) return;

        const parsed =
            JSON.parse(raw);

        if (!Array.isArray(parsed) || parsed.length === 0) return;

        const messages =
            parsed
                .filter(
                    (item) =>
                        item
                        &&
                        (
                            item.role === "user"
                            ||
                            item.role === "assistant"
                        )
                        &&
                        typeof item.content === "string"
                )
                .slice(-MAX_MESSAGES_PER_CONVERSATION);

        if (messages.length === 0) return;

        const conversation =
            createConversation();

        conversation.messages =
            messages;

        conversation.title =
            createTitleFromMessages(
                messages
            );

        conversations =
            [conversation];

        activeConversationId =
            conversation.id;

        saveHistory();
        saveActiveConversationId();

        console.log("기존 AI 학습 도우미 대화를 새 대화목록으로 이전했습니다.");
    }
    catch (error) {
        console.warn("기존 챗봇 대화 마이그레이션 실패:", error);
    }
}

function saveHistory() {
    try {
        conversations =
            [...conversations]
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime()
                        -
                        new Date(a.updatedAt).getTime()
                )
                .slice(0, MAX_CONVERSATIONS);

        localStorage.setItem(
            historyStorageKey(),
            JSON.stringify(
                conversations
            )
        );
    }
    catch (error) {
        console.warn("AI 학습 도우미 대화목록 저장 실패:", error);
    }
}

function loadActiveConversationId() {
    try {
        activeConversationId =
            localStorage.getItem(
                activeStorageKey()
            );
    }
    catch {
        activeConversationId =
            null;
    }
}

function saveActiveConversationId() {
    try {
        if (activeConversationId) {
            localStorage.setItem(
                activeStorageKey(),
                activeConversationId
            );
        }
        else {
            localStorage.removeItem(
                activeStorageKey()
            );
        }
    }
    catch {}
}

function ensureActiveConversation() {
    let conversation =
        conversations.find(
            (item) =>
                item.id === activeConversationId
        );

    if (conversation) {
        return conversation;
    }

    if (conversations.length > 0) {
        activeConversationId =
            conversations[0].id;

        saveActiveConversationId();

        return conversations[0];
    }

    conversation =
        createConversation();

    conversations.unshift(
        conversation
    );

    activeConversationId =
        conversation.id;

    saveHistory();
    saveActiveConversationId();

    return conversation;
}

function getActiveConversation() {
    return ensureActiveConversation();
}

function createTitleFromMessages(messages) {
    const firstUserMessage =
        messages.find(
            (item) =>
                item.role === "user"
                &&
                String(item.content || "").trim()
        );

    if (!firstUserMessage) {
        return "새 대화";
    }

    const cleaned =
        String(firstUserMessage.content)
            .replace(/\s+/g, " ")
            .trim();

    if (!cleaned) {
        return "새 대화";
    }

    const maxLength =
        28;

    return cleaned.length > maxLength
        ? `${cleaned.slice(0, maxLength).trim()}…`
        : cleaned;
}

function updateConversationMetadata(conversation) {
    conversation.updatedAt =
        new Date().toISOString();

    if (
        !conversation.title
        ||
        conversation.title === "새 대화"
    ) {
        conversation.title =
            createTitleFromMessages(
                conversation.messages
            );
    }
}


/* =========================================================
   UI
========================================================= */

function createChatbotUi() {
    const root =
        document.createElement(
            "div"
        );

    root.className =
        "echo-chat-root";

    root.id =
        "echoLearningChatbotRoot";

    root.innerHTML =
        `
        <button
            class="echo-chat-launcher"
            id="echoChatLauncher"
            type="button"
            aria-label="AI 학습 도우미 열기"
            title="AI 학습 도우미"
        >
            <svg
                class="echo-chat-launcher-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M5 4.75h14A2.25 2.25 0 0 1 21.25 7v8A2.25 2.25 0 0 1 19 17.25h-7.35L7.2 20.6a.75.75 0 0 1-1.2-.6v-2.75H5A2.25 2.25 0 0 1 2.75 15V7A2.25 2.25 0 0 1 5 4.75Z"
                    fill="currentColor"
                />
                <circle cx="8" cy="11" r="1.2" fill="#3867f4"/>
                <circle cx="12" cy="11" r="1.2" fill="#3867f4"/>
                <circle cx="16" cy="11" r="1.2" fill="#3867f4"/>
            </svg>
        </button>

        <section
            class="echo-chat-panel"
            id="echoChatPanel"
            aria-label="AI 학습 도우미"
            hidden
        >
            <header class="echo-chat-head">
                <div class="echo-chat-title">
                    <small>LEARNING ASSISTANT</small>
                    <strong>AI 학습 도우미</strong>
                </div>

                <div class="echo-chat-actions">
                    <button
                        id="echoChatHistory"
                        type="button"
                    >
                        대화목록
                    </button>

                    <button
                        id="echoChatNew"
                        type="button"
                    >
                        새 대화
                    </button>

                    <button
                        id="echoChatHide"
                        type="button"
                    >
                        숨김
                    </button>
                </div>
            </header>

            <div
                class="echo-chat-history-view"
                id="echoChatHistoryView"
                hidden
            >
                <div class="echo-chat-history-top">
                    <div>
                        <small>CONVERSATIONS</small>
                        <strong>대화 기록</strong>
                    </div>

                    <button
                        class="echo-chat-history-close"
                        id="echoChatHistoryClose"
                        type="button"
                    >
                        현재 대화
                    </button>
                </div>

                <div
                    class="echo-chat-history-list"
                    id="echoChatHistoryList"
                ></div>
            </div>

            <div
                class="echo-chat-main-view"
                id="echoChatMainView"
            >
                <div
                    class="echo-chat-messages"
                    id="echoChatMessages"
                    aria-live="polite"
                ></div>

                <form
                    class="echo-chat-compose"
                    id="echoChatForm"
                >
                    <div class="echo-chat-row">
                        <textarea
                            class="echo-chat-input"
                            id="echoChatInput"
                            rows="1"
                            placeholder="학습에 대해 무엇이든 질문해 보세요."
                            aria-label="학습 질문 입력"
                        ></textarea>

                        <button
                            class="echo-chat-send"
                            id="echoChatSend"
                            type="submit"
                        >
                            전송
                        </button>
                    </div>

                    <p class="echo-chat-hint">
                        Enter 전송 · Shift+Enter 줄바꿈 · 긴 질문 가능
                    </p>
                </form>
            </div>
        </section>
        `;

    const app =
        document.querySelector(
            "#app"
        );

    if (!app) {
        throw new Error(
            "Echo Path #app을 찾을 수 없습니다."
        );
    }

    app.appendChild(
        root
    );

    return root;
}


const root =
    createChatbotUi();

const launcher =
    root.querySelector("#echoChatLauncher");

const panel =
    root.querySelector("#echoChatPanel");

const mainView =
    root.querySelector("#echoChatMainView");

const historyView =
    root.querySelector("#echoChatHistoryView");

const historyList =
    root.querySelector("#echoChatHistoryList");

const historyButton =
    root.querySelector("#echoChatHistory");

const historyCloseButton =
    root.querySelector("#echoChatHistoryClose");

const messagesElement =
    root.querySelector("#echoChatMessages");

const form =
    root.querySelector("#echoChatForm");

const input =
    root.querySelector("#echoChatInput");

const sendButton =
    root.querySelector("#echoChatSend");

const hideButton =
    root.querySelector("#echoChatHide");

const newButton =
    root.querySelector("#echoChatNew");


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatConversationDate(isoString) {
    const date =
        new Date(
            isoString
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const now =
        new Date();

    const today =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const target =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const differenceDays =
        Math.round(
            (
                today.getTime()
                -
                target.getTime()
            )
            /
            86400000
        );

    if (differenceDays === 0) {
        return `오늘 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    if (differenceDays === 1) {
        return "어제";
    }

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function renderMessages() {
    const conversation =
        getActiveConversation();

    messagesElement.innerHTML =
        `
        <p class="echo-chat-welcome">
            저는 Echo Path의 학습 전용 AI 도우미입니다.
            교과 개념, 문제 풀이, 탐구, 과제, 발표 준비, 공부 방법 등을 질문해 주세요.
        </p>
        `;

    conversation.messages.forEach(
        (item) => {
            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                `echo-chat-msg ${item.role}`;

            wrapper.innerHTML =
                `
                <span class="echo-chat-label">${item.role === "user" ? "나" : "AI"}</span>
                <div class="echo-chat-bubble">${escapeHtml(item.content)}</div>
                `;

            messagesElement.appendChild(
                wrapper
            );
        }
    );

    messagesElement.scrollTop =
        messagesElement.scrollHeight;
}

function renderHistory() {
    historyList.innerHTML =
        "";

    const sorted =
        [...conversations]
            .sort(
                (a, b) =>
                    new Date(b.updatedAt).getTime()
                    -
                    new Date(a.updatedAt).getTime()
            );

    if (sorted.length === 0) {
        historyList.innerHTML =
            `<p class="echo-chat-history-empty">저장된 대화가 없습니다.</p>`;

        return;
    }

    sorted.forEach(
        (conversation) => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "echo-chat-history-item";

            if (
                conversation.id
                ===
                activeConversationId
            ) {
                item.classList.add(
                    "active"
                );
            }

            item.innerHTML =
                `
                <button
                    type="button"
                    class="echo-chat-history-open"
                    data-conversation-id="${escapeHtml(conversation.id)}"
                >
                    <strong>${escapeHtml(conversation.title || "새 대화")}</strong>
                    <span>${escapeHtml(formatConversationDate(conversation.updatedAt))}</span>
                </button>

                <button
                    type="button"
                    class="echo-chat-history-delete"
                    data-delete-conversation-id="${escapeHtml(conversation.id)}"
                    aria-label="대화 삭제"
                    title="대화 삭제"
                >
                    ×
                </button>
                `;

            historyList.appendChild(
                item
            );
        }
    );
}

function showMainView() {
    historyView.hidden =
        true;

    mainView.hidden =
        false;

    renderMessages();

    window.setTimeout(
        () => input.focus(),
        30
    );
}

function showHistoryView() {
    mainView.hidden =
        true;

    historyView.hidden =
        false;

    renderHistory();
}

function openChat() {
    panel.hidden =
        false;

    launcher.hidden =
        true;

    showMainView();
}

function hideChat() {
    panel.hidden =
        true;

    launcher.hidden =
        false;
}

function autoResizeInput() {
    input.style.height =
        "auto";

    input.style.height =
        `${Math.min(
            input.scrollHeight,
            132
        )}px`;
}

function startNewConversation() {
    const current =
        getActiveConversation();

    /*
        완전히 비어 있는 새 대화라면 중복으로 또 만들지 않습니다.
    */
    if (
        current.messages.length === 0
        &&
        current.title === "새 대화"
    ) {
        showMainView();
        return;
    }

    const conversation =
        createConversation();

    conversations.unshift(
        conversation
    );

    activeConversationId =
        conversation.id;

    saveHistory();
    saveActiveConversationId();

    showMainView();
}

function openConversation(conversationId) {
    const conversation =
        conversations.find(
            (item) =>
                item.id === conversationId
        );

    if (!conversation) {
        return;
    }

    activeConversationId =
        conversation.id;

    saveActiveConversationId();

    showMainView();
}

function deleteConversation(conversationId) {
    const target =
        conversations.find(
            (item) =>
                item.id === conversationId
        );

    if (!target) {
        return;
    }

    const confirmed =
        window.confirm(
            `"${target.title || "이 대화"}"를 삭제할까요?`
        );

    if (!confirmed) {
        return;
    }

    conversations =
        conversations.filter(
            (item) =>
                item.id !== conversationId
        );

    if (
        activeConversationId
        ===
        conversationId
    ) {
        activeConversationId =
            conversations[0]?.id
            ?? null;
    }

    if (
        conversations.length === 0
    ) {
        const conversation =
            createConversation();

        conversations =
            [conversation];

        activeConversationId =
            conversation.id;
    }

    saveHistory();
    saveActiveConversationId();
    renderHistory();
}


/* =========================================================
   Chat request
========================================================= */

function showTypingIndicator() {
    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "echo-chat-msg assistant";

    wrapper.id =
        "echoChatTyping";

    wrapper.innerHTML =
        `
        <span class="echo-chat-label">AI</span>
        <div class="echo-chat-bubble echo-chat-typing">
            답변을 생각하고 있습니다...
        </div>
        `;

    messagesElement.appendChild(
        wrapper
    );

    messagesElement.scrollTop =
        messagesElement.scrollHeight;
}

function removeTypingIndicator() {
    document.querySelector(
        "#echoChatTyping"
    )?.remove();
}

function showErrorMessage(message) {
    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "echo-chat-msg assistant";

    wrapper.innerHTML =
        `
        <span class="echo-chat-label">AI</span>
        <div class="echo-chat-bubble echo-chat-error">
            ${escapeHtml(message)}
        </div>
        `;

    messagesElement.appendChild(
        wrapper
    );

    messagesElement.scrollTop =
        messagesElement.scrollHeight;
}

async function sendMessage() {
    const content =
        String(
            input.value
            ?? ""
        ).trim();

    if (
        !content
        ||
        isSending
    ) {
        return;
    }

    const conversation =
        getActiveConversation();

    isSending =
        true;

    sendButton.disabled =
        true;

    conversation.messages.push({
        role: "user",
        content
    });

    conversation.messages =
        conversation.messages.slice(
            -MAX_MESSAGES_PER_CONVERSATION
        );

    updateConversationMetadata(
        conversation
    );

    saveHistory();

    input.value =
        "";

    autoResizeInput();
    renderMessages();
    showTypingIndicator();

    try {
        const payloadMessages =
            conversation.messages.map(
                (item) => ({
                    role: item.role,
                    content: item.content
                })
            );

        const {
            data,
            error
        } =
            await supabase.functions.invoke(
                FUNCTION_NAME,
                {
                    body: {
                        messages:
                            payloadMessages
                    }
                }
            );

        if (error) {
            throw error;
        }

        const reply =
            String(
                data?.reply
                ?? ""
            ).trim();

        if (!reply) {
            throw new Error(
                "AI 답변이 비어 있습니다."
            );
        }

        conversation.messages.push({
            role: "assistant",
            content: reply
        });

        conversation.messages =
            conversation.messages.slice(
                -MAX_MESSAGES_PER_CONVERSATION
            );

        updateConversationMetadata(
            conversation
        );

        saveHistory();

        removeTypingIndicator();
        renderMessages();
    }
    catch (error) {
        removeTypingIndicator();

        console.error(
            "AI 학습 도우미 요청 실패:",
            error
        );

        showErrorMessage(
            "답변을 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        );
    }
    finally {
        isSending =
            false;

        sendButton.disabled =
            false;

        input.focus();
    }
}


/* =========================================================
   Events
========================================================= */

form.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();
        void sendMessage();
    }
);

input.addEventListener(
    "input",
    autoResizeInput
);

input.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Enter"
            &&
            !event.shiftKey
            &&
            !event.isComposing
        ) {
            event.preventDefault();
            void sendMessage();
        }
    }
);

hideButton.addEventListener(
    "click",
    hideChat
);

newButton.addEventListener(
    "click",
    startNewConversation
);

historyButton.addEventListener(
    "click",
    showHistoryView
);

historyCloseButton.addEventListener(
    "click",
    showMainView
);

historyList.addEventListener(
    "click",
    (event) => {
        const openButton =
            event.target.closest(
                "[data-conversation-id]"
            );

        if (openButton) {
            openConversation(
                openButton.dataset.conversationId
            );

            return;
        }

        const deleteButton =
            event.target.closest(
                "[data-delete-conversation-id]"
            );

        if (deleteButton) {
            deleteConversation(
                deleteButton.dataset.deleteConversationId
            );
        }
    }
);


/* =========================================================
   Floating launcher drag
========================================================= */

function clamp(value, min, max) {
    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );
}

function saveLauncherPosition() {
    try {
        const rect =
            launcher.getBoundingClientRect();

        localStorage.setItem(
            POSITION_STORAGE_KEY,
            JSON.stringify({
                left: rect.left,
                top: rect.top
            })
        );
    }
    catch (error) {
        console.warn(
            "AI 아이콘 위치 저장 실패:",
            error
        );
    }
}

function restoreLauncherPosition() {
    try {
        const raw =
            localStorage.getItem(
                POSITION_STORAGE_KEY
            );

        if (!raw) {
            return;
        }

        const position =
            JSON.parse(
                raw
            );

        if (
            !Number.isFinite(
                Number(position?.left)
            )
            ||
            !Number.isFinite(
                Number(position?.top)
            )
        ) {
            return;
        }

        const width =
            launcher.offsetWidth
            || 56;

        const height =
            launcher.offsetHeight
            || 56;

        launcher.style.right =
            "auto";

        launcher.style.bottom =
            "auto";

        launcher.style.left =
            `${clamp(
                Number(position.left),
                8,
                Math.max(
                    8,
                    window.innerWidth
                    -
                    width
                    -
                    8
                )
            )}px`;

        launcher.style.top =
            `${clamp(
                Number(position.top),
                8,
                Math.max(
                    8,
                    window.innerHeight
                    -
                    height
                    -
                    82
                )
            )}px`;
    }
    catch (error) {
        console.warn(
            "AI 아이콘 위치 복원 실패:",
            error
        );
    }
}

launcher.addEventListener(
    "pointerdown",
    (event) => {
        launcherDragging =
            true;

        launcherMoved =
            false;

        dragStartX =
            event.clientX;

        dragStartY =
            event.clientY;

        const rect =
            launcher.getBoundingClientRect();

        launcherStartLeft =
            rect.left;

        launcherStartTop =
            rect.top;

        launcher.setPointerCapture(
            event.pointerId
        );
    }
);

launcher.addEventListener(
    "pointermove",
    (event) => {
        if (!launcherDragging) {
            return;
        }

        const dx =
            event.clientX
            -
            dragStartX;

        const dy =
            event.clientY
            -
            dragStartY;

        if (
            Math.abs(dx)
            +
            Math.abs(dy)
            >
            5
        ) {
            launcherMoved =
                true;
        }

        const width =
            launcher.offsetWidth
            || 56;

        const height =
            launcher.offsetHeight
            || 56;

        launcher.style.right =
            "auto";

        launcher.style.bottom =
            "auto";

        launcher.style.left =
            `${clamp(
                launcherStartLeft
                +
                dx,
                8,
                Math.max(
                    8,
                    window.innerWidth
                    -
                    width
                    -
                    8
                )
            )}px`;

        launcher.style.top =
            `${clamp(
                launcherStartTop
                +
                dy,
                8,
                Math.max(
                    8,
                    window.innerHeight
                    -
                    height
                    -
                    82
                )
            )}px`;
    }
);

launcher.addEventListener(
    "pointerup",
    (event) => {
        if (!launcherDragging) {
            return;
        }

        launcherDragging =
            false;

        try {
            launcher.releasePointerCapture(
                event.pointerId
            );
        }
        catch {}

        if (launcherMoved) {
            saveLauncherPosition();
        }
        else {
            openChat();
        }
    }
);

launcher.addEventListener(
    "pointercancel",
    () => {
        launcherDragging =
            false;
    }
);

window.addEventListener(
    "resize",
    restoreLauncherPosition
);


/* =========================================================
   Auth / initialization
========================================================= */

async function initializeUserConversation() {
    try {
        const {
            data
        } =
            await supabase.auth.getSession();

        currentUserId =
            data?.session?.user?.id
            ||
            "guest";
    }
    catch (error) {
        console.warn(
            "AI 학습 도우미 사용자 확인 실패:",
            error
        );

        currentUserId =
            "guest";
    }

    loadHistory();
    loadActiveConversationId();
    migrateLegacyConversationIfNeeded();
    ensureActiveConversation();

    renderMessages();
    restoreLauncherPosition();
}

supabase.auth.onAuthStateChange(
    (_event, session) => {
        currentUserId =
            session?.user?.id
            ||
            "guest";

        loadHistory();
        loadActiveConversationId();
        migrateLegacyConversationIfNeeded();
        ensureActiveConversation();

        renderMessages();
        hideChat();
    }
);

void initializeUserConversation();
