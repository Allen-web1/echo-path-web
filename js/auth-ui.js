/* =========================================
   Echo Path
   Login / Signup UI
========================================= */

import {
    getCurrentUser,
    signInWithEmail,
    signUpWithEmail,
    signOut
}
from "./auth.js";

import {
    supabase
}
from "./supabase.js";


const authGate =
    document.querySelector("#authGate");

const appRoot =
    document.querySelector("#app");

const loginForm =
    document.querySelector("#loginForm");

const signupForm =
    document.querySelector("#signupForm");

const showLoginButton =
    document.querySelector("#showLoginButton");

const showSignupButton =
    document.querySelector("#showSignupButton");

const loginEmail =
    document.querySelector("#loginEmail");

const loginPassword =
    document.querySelector("#loginPassword");

const signupEmail =
    document.querySelector("#signupEmail");

const signupPassword =
    document.querySelector("#signupPassword");

const signupPasswordConfirm =
    document.querySelector("#signupPasswordConfirm");

const loginButton =
    document.querySelector("#loginButton");

const signupButton =
    document.querySelector("#signupButton");

const loginStatus =
    document.querySelector("#loginStatus");

const currentAccountEmail =
    document.querySelector(
        "#currentAccountEmail"
    );

/* =========================================
   상태 메시지
========================================= */

function setAuthStatus(
    message,
    isError = false
) {

    if (!loginStatus) {
        return;
    }

    loginStatus.textContent =
        message ?? "";

    loginStatus.dataset.state =
        isError
            ? "error"
            : "info";
}



/* =========================================
   최초 자기인식 사전 설문
========================================= */

function ensureAssessmentStyles() {

    if (
        document.querySelector(
            "#echoPathAssessmentStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "echoPathAssessmentStyles";

    style.textContent = `
        .ep-assessment-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(7, 18, 43, 0.58);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            overflow-y: auto;
            padding: 24px 14px;
            box-sizing: border-box;
        }

        .ep-assessment-card {
            width: min(760px, 100%);
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 24px 70px rgba(14, 49, 145, 0.24);
            padding: 26px;
            box-sizing: border-box;
            color: #172033;
        }

        .ep-assessment-kicker {
            margin: 0 0 6px;
            color: #024ad8;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.12em;
        }

        .ep-assessment-card h2 {
            margin: 0;
            font-size: clamp(24px, 4vw, 34px);
            line-height: 1.22;
        }

        .ep-assessment-intro {
            margin: 10px 0 22px;
            color: #64708a;
            line-height: 1.65;
        }

        .ep-assessment-question {
            padding: 18px 0;
            border-top: 1px solid #e8edf5;
        }

        .ep-assessment-question:first-of-type {
            border-top: 0;
        }

        .ep-assessment-question > label,
        .ep-assessment-question > .ep-question-title {
            display: block;
            margin-bottom: 10px;
            font-size: 15px;
            font-weight: 750;
            line-height: 1.55;
        }

        .ep-assessment-card input[type="number"],
        .ep-assessment-card input[type="text"] {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #ced7e7;
            border-radius: 12px;
            padding: 12px 13px;
            font: inherit;
            background: #fbfcff;
            color: #172033;
            outline: none;
        }

        .ep-assessment-card input[type="number"]:focus,
        .ep-assessment-card input[type="text"]:focus {
            border-color: #296ef9;
            box-shadow: 0 0 0 3px rgba(41, 110, 249, 0.12);
        }

        .ep-assessment-card input[type="range"] {
            width: 100%;
            accent-color: #024ad8;
        }

        .ep-scale-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            color: #71809a;
            font-size: 12px;
        }

        .ep-scale-value {
            min-width: 46px;
            text-align: center;
            color: #024ad8;
            font-weight: 800;
        }

        .ep-assessment-help {
            margin: 8px 0 0;
            color: #8490a5;
            font-size: 12px;
            line-height: 1.5;
        }

        .ep-radio-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .ep-radio-row label {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: 1px solid #d9e0ec;
            border-radius: 999px;
            padding: 9px 14px;
            cursor: pointer;
            background: #fbfcff;
        }

        .ep-reduction-extra[hidden] {
            display: none !important;
        }

        .ep-assessment-status {
            min-height: 22px;
            margin: 12px 0 0;
            color: #b3262b;
            font-size: 13px;
        }

        .ep-assessment-submit {
            width: 100%;
            border: 0;
            border-radius: 14px;
            padding: 14px 18px;
            background: #024ad8;
            color: #ffffff;
            font: inherit;
            font-weight: 800;
            cursor: pointer;
        }

        .ep-assessment-submit:disabled {
            opacity: 0.55;
            cursor: wait;
        }

        @media (max-width: 640px) {
            .ep-assessment-overlay {
                padding: 0;
            }

            .ep-assessment-card {
                min-height: 100dvh;
                border-radius: 0;
                padding: 22px 18px 32px;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}


function fivePointQuestion(
    name,
    number,
    text
) {

    return `
        <div class="ep-assessment-question">
            <label for="ep_${name}">
                ${number}. ${text}
            </label>

            <div class="ep-scale-row">
                <span>1 · 전혀 그렇지 않음</span>
                <strong
                    class="ep-scale-value"
                    data-value-for="${name}"
                >
                    3점
                </strong>
                <span>5 · 매우 그렇다</span>
            </div>

            <input
                id="ep_${name}"
                name="${name}"
                type="range"
                min="1"
                max="5"
                step="1"
                value="3"
            >
        </div>
    `;
}


function createAssessmentModal(
    user
) {

    ensureAssessmentStyles();

    const existing =
        document.querySelector(
            "#echoPathAssessmentOverlay"
        );

    if (existing) {
        existing.remove();
    }

    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "echoPathAssessmentOverlay";

    overlay.className =
        "ep-assessment-overlay";

    overlay.innerHTML = `
        <section
            class="ep-assessment-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="epAssessmentTitle"
        >
            <p class="ep-assessment-kicker">
                FIRST STEP
            </p>

            <h2 id="epAssessmentTitle">
                스마트폰 이용 습관 자기인식 설문
            </h2>

            <p class="ep-assessment-intro">
                실제 사용 데이터를 보기 전에 현재 자신의 스마트폰 이용 습관을 예상해 주세요.
                이 설문은 최초 1회만 진행하며, 이후 실제 측정값과 비교하는 데 사용됩니다.
            </p>

            <form id="echoPathAssessmentForm">

                <div class="ep-assessment-question">
                    <label for="epEstimatedMinutes">
                        1. 하루 평균 스마트폰 사용시간이 얼마나 된다고 생각하나요?
                    </label>

                    <input
                        id="epEstimatedMinutes"
                        name="estimated_daily_minutes"
                        type="number"
                        min="0"
                        max="1440"
                        inputmode="numeric"
                        placeholder="분 단위로 입력"
                        required
                    >
                </div>

                <div class="ep-assessment-question">
                    <label for="epFrequentApps">
                        2. 평소 자주 사용하는 앱은 무엇인가요?
                    </label>

                    <input
                        id="epFrequentApps"
                        name="frequent_apps"
                        type="text"
                        placeholder="예: Chrome, YouTube, Samsung Notes"
                    >

                    <p class="ep-assessment-help">
                        여러 앱은 쉼표(,)로 구분해 주세요.
                    </p>
                </div>

                ${fivePointQuestion(
                    "switching_frequency",
                    "3",
                    "스마트폰을 사용할 때 앱을 자주 전환한다고 생각하나요?"
                )}

                ${fivePointQuestion(
                    "habitual_checking",
                    "4",
                    "특별한 목적 없이 습관적으로 스마트폰을 확인하는 편인가요?"
                )}

                <div class="ep-assessment-question">
                    <label for="epLearningRatio">
                        5. 전체 스마트폰 사용 중 학습 목적 사용 비율은 몇 %라고 생각하나요?
                    </label>

                    <input
                        id="epLearningRatio"
                        name="learning_use_ratio"
                        type="number"
                        min="0"
                        max="100"
                        inputmode="numeric"
                        placeholder="0~100"
                        required
                    >
                </div>

                <div class="ep-assessment-question">
                    <label for="epEntertainmentRatio">
                        6. 전체 스마트폰 사용 중 오락 목적 사용 비율은 몇 %라고 생각하나요?
                    </label>

                    <input
                        id="epEntertainmentRatio"
                        name="entertainment_use_ratio"
                        type="number"
                        min="0"
                        max="100"
                        inputmode="numeric"
                        placeholder="0~100"
                        required
                    >
                </div>

                ${fivePointQuestion(
                    "learning_focus_level",
                    "7",
                    "스마트폰을 학습에 사용할 때 한 가지 활동에 집중하는 편인가요?"
                )}

                ${fivePointQuestion(
                    "smartphone_distraction_level",
                    "8",
                    "스마트폰 알림이나 다른 앱 때문에 학습 집중이 흐트러지는 편인가요?"
                )}

                ${fivePointQuestion(
                    "self_control_level",
                    "9",
                    "필요할 때 스마트폰 사용을 스스로 멈추거나 조절할 수 있다고 생각하나요?"
                )}

                ${fivePointQuestion(
                    "urge_to_check_level",
                    "10",
                    "학습 중에도 다른 앱이나 메시지를 확인하고 싶은 충동을 자주 느끼나요?"
                )}

                <div class="ep-assessment-question">
                    <span class="ep-question-title">
                        11. 이전에 스마트폰 사용을 줄이거나 조절하기 위해 노력해 본 적이 있나요?
                    </span>

                    <div class="ep-radio-row">
                        <label>
                            <input
                                type="radio"
                                name="reduction_attempted"
                                value="true"
                                required
                            >
                            있다
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="reduction_attempted"
                                value="false"
                                required
                            >
                            없다
                        </label>
                    </div>
                </div>

                <div
                    id="epReductionExtra"
                    class="ep-reduction-extra"
                    hidden
                >
                    <div class="ep-assessment-question">
                        <label for="epReductionMethods">
                            11-1. 어떤 방법을 사용했나요?
                        </label>

                        <input
                            id="epReductionMethods"
                            name="reduction_methods"
                            type="text"
                            placeholder="예: 앱 시간 제한, 알림 끄기, 스마트폰 멀리 두기"
                        >

                        <p class="ep-assessment-help">
                            여러 방법은 쉼표(,)로 구분해 주세요.
                        </p>
                    </div>

                    ${fivePointQuestion(
                        "reduction_effectiveness",
                        "11-2",
                        "그 방법이 실제로 효과가 있었다고 생각하나요?"
                    )}
                </div>

                <p
                    id="epAssessmentStatus"
                    class="ep-assessment-status"
                    aria-live="polite"
                ></p>

                <button
                    id="epAssessmentSubmit"
                    class="ep-assessment-submit"
                    type="submit"
                >
                    설문 제출하고 Echo Path 시작하기
                </button>

            </form>
        </section>
    `;

    document.body.appendChild(
        overlay
    );

    document.body.style.overflow =
        "hidden";

    overlay
        .querySelectorAll(
            'input[type="range"]'
        )
        .forEach(
            (input) => {

                const valueElement =
                    overlay.querySelector(
                        `[data-value-for="${input.name}"]`
                    );

                const updateValue =
                    () => {

                        if (valueElement) {
                            valueElement.textContent =
                                `${input.value}점`;
                        }
                    };

                input.addEventListener(
                    "input",
                    updateValue
                );

                updateValue();
            }
        );

    const reductionExtra =
        overlay.querySelector(
            "#epReductionExtra"
        );

    overlay
        .querySelectorAll(
            'input[name="reduction_attempted"]'
        )
        .forEach(
            (radio) => {

                radio.addEventListener(
                    "change",
                    () => {

                        if (reductionExtra) {
                            reductionExtra.hidden =
                                radio.value !== "true";
                        }
                    }
                );
            }
        );

    const form =
        overlay.querySelector(
            "#echoPathAssessmentForm"
        );

    const status =
        overlay.querySelector(
            "#epAssessmentStatus"
        );

    const submitButton =
        overlay.querySelector(
            "#epAssessmentSubmit"
        );

    form?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!user?.id) {

                if (status) {
                    status.textContent =
                        "로그인 사용자 정보를 확인할 수 없습니다.";
                }

                return;
            }

            const formData =
                new FormData(
                    form
                );

            const estimatedDailyMinutes =
                Number(
                    formData.get(
                        "estimated_daily_minutes"
                    )
                );

            const learningUseRatio =
                Number(
                    formData.get(
                        "learning_use_ratio"
                    )
                );

            const entertainmentUseRatio =
                Number(
                    formData.get(
                        "entertainment_use_ratio"
                    )
                );

            if (
                !Number.isFinite(
                    estimatedDailyMinutes
                )
                ||
                estimatedDailyMinutes < 0
                ||
                estimatedDailyMinutes > 1440
            ) {

                if (status) {
                    status.textContent =
                        "하루 예상 사용시간을 0~1440분 사이로 입력해 주세요.";
                }

                return;
            }

            if (
                !Number.isFinite(
                    learningUseRatio
                )
                ||
                learningUseRatio < 0
                ||
                learningUseRatio > 100
                ||
                !Number.isFinite(
                    entertainmentUseRatio
                )
                ||
                entertainmentUseRatio < 0
                ||
                entertainmentUseRatio > 100
            ) {

                if (status) {
                    status.textContent =
                        "학습·오락 목적 사용 비율을 각각 0~100 사이로 입력해 주세요.";
                }

                return;
            }

            const reductionAttempted =
                formData.get(
                    "reduction_attempted"
                ) === "true";

            const splitList =
                (value) =>
                    String(
                        value ?? ""
                    )
                        .split(",")
                        .map(
                            (item) =>
                                item.trim()
                        )
                        .filter(
                            Boolean
                        );

            const row = {

                user_id:
                    user.id,

                assessment_type:
                    "pre",

                estimated_daily_minutes:
                    Math.round(
                        estimatedDailyMinutes
                    ),

                frequent_apps:
                    splitList(
                        formData.get(
                            "frequent_apps"
                        )
                    ),

                switching_frequency:
                    Number(
                        formData.get(
                            "switching_frequency"
                        )
                    ),

                habitual_checking:
                    Number(
                        formData.get(
                            "habitual_checking"
                        )
                    ),

                learning_use_ratio:
                    Math.round(
                        learningUseRatio
                    ),

                entertainment_use_ratio:
                    Math.round(
                        entertainmentUseRatio
                    ),

                learning_focus_level:
                    Number(
                        formData.get(
                            "learning_focus_level"
                        )
                    ),

                smartphone_distraction_level:
                    Number(
                        formData.get(
                            "smartphone_distraction_level"
                        )
                    ),

                self_control_level:
                    Number(
                        formData.get(
                            "self_control_level"
                        )
                    ),

                urge_to_check_level:
                    Number(
                        formData.get(
                            "urge_to_check_level"
                        )
                    ),

                reduction_attempted:
                    reductionAttempted,

                reduction_methods:
                    reductionAttempted
                        ?
                        splitList(
                            formData.get(
                                "reduction_methods"
                            )
                        )
                        :
                        [],

                reduction_effectiveness:
                    reductionAttempted
                        ?
                        Number(
                            formData.get(
                                "reduction_effectiveness"
                            )
                        )
                        :
                        null
            };

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "저장 중...";
            }

            if (status) {
                status.textContent =
                    "";
            }

            try {

                const {
                    error
                } =
                    await supabase
                        .from(
                            "self_assessments"
                        )
                        .upsert(
                            row,
                            {
                                onConflict:
                                    "user_id,assessment_type"
                            }
                        );

                if (error) {
                    throw error;
                }

                document.body.style.overflow =
                    "";

                overlay.remove();

                window.location.reload();

            } catch (error) {

                console.error(
                    "자기인식 사전 설문 저장 실패:",
                    error
                );

                if (status) {
                    status.textContent =
                        "설문 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
                }

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "설문 제출하고 Echo Path 시작하기";
                }
            }
        }
    );
}


async function ensureInitialSelfAssessment(
    user
) {

    if (!user?.id) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from(
                    "self_assessments"
                )
                .select(
                    "user_id"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .eq(
                    "assessment_type",
                    "pre"
                )
                .limit(
                    1
                );

        if (error) {
            throw error;
        }

        if (
            Array.isArray(data)
            &&
            data.length > 0
        ) {
            return;
        }

        createAssessmentModal(
            user
        );

    } catch (error) {

        console.error(
            "최초 자기인식 설문 확인 실패:",
            error
        );
    }
}


/* =========================================
   앱 / 로그인 화면 전환
========================================= */

async function showAuthenticatedApp() {

    if (authGate) {
        authGate.hidden = true;
    }

    if (appRoot) {
        appRoot.hidden = false;
    }

    try {

        const user =
            await getCurrentUser();

        if (
            currentAccountEmail
            &&
            user?.email
        ) {

            currentAccountEmail.textContent =
                user.email;
        }

        await ensureInitialSelfAssessment(
            user
        );

    } catch (error) {

        console.error(
            "로그인 후 초기화 실패:",
            error
        );

        if (currentAccountEmail) {

            currentAccountEmail.textContent =
                "계정 정보를 불러올 수 없습니다.";
        }
    }
}


function showLoginGate() {

    if (authGate) {
        authGate.hidden = false;
    }

    if (appRoot) {
        appRoot.hidden = true;
    }
}


/* =========================================
   로그인 / 회원가입 탭
========================================= */

function showLoginMode() {

    if (loginForm) {
        loginForm.hidden = false;
    }

    if (signupForm) {
        signupForm.hidden = true;
    }

    if (showLoginButton) {
        showLoginButton.classList.add(
            "active"
        );
    }

    if (showSignupButton) {
        showSignupButton.classList.remove(
            "active"
        );
    }

    setAuthStatus("");
}


function showSignupMode() {

    if (loginForm) {
        loginForm.hidden = true;
    }

    if (signupForm) {
        signupForm.hidden = false;
    }

    if (showLoginButton) {
        showLoginButton.classList.remove(
            "active"
        );
    }

    if (showSignupButton) {
        showSignupButton.classList.add(
            "active"
        );
    }

    setAuthStatus("");
}


/* =========================================
   처음 접속했을 때 로그인 상태 확인
========================================= */

async function initializeAuthentication() {

    try {

        const user =
            await getCurrentUser();

        if (user) {

            showAuthenticatedApp();

        } else {

            showLoginGate();

            showLoginMode();
        }

    } catch (error) {

        console.error(
            "로그인 상태 확인 실패:",
            error
        );

        showLoginGate();

        showLoginMode();
    }
}


/* =========================================
   탭 버튼
========================================= */

if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        showLoginMode
    );
}


if (showSignupButton) {

    showSignupButton.addEventListener(
        "click",
        showSignupMode
    );
}


/* =========================================
   로그인
========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (
                !loginEmail
                ||
                !loginPassword
            ) {
                return;
            }


            if (loginButton) {

                loginButton.disabled =
                    true;
            }


            setAuthStatus(
                "로그인 중..."
            );


            try {

                await signInWithEmail(
                    loginEmail.value,
                    loginPassword.value
                );


                setAuthStatus("");


                window.location.reload();

            } catch (error) {

                console.error(
                    "로그인 실패:",
                    error
                );


                setAuthStatus(
                    "이메일 또는 비밀번호를 확인하세요.",
                    true
                );

            } finally {

                if (loginButton) {

                    loginButton.disabled =
                        false;
                }
            }
        }
    );
}


/* =========================================
   회원가입
========================================= */

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (
                !signupEmail
                ||
                !signupPassword
                ||
                !signupPasswordConfirm
            ) {
                return;
            }


            /* 비밀번호 일치 확인 */

            if (
                signupPassword.value
                !==
                signupPasswordConfirm.value
            ) {

                setAuthStatus(
                    "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
                    true
                );

                return;
            }


            if (signupButton) {

                signupButton.disabled =
                    true;
            }


            setAuthStatus(
                "계정을 만드는 중..."
            );


            try {

                const result =
                    await signUpWithEmail(
                        signupEmail.value,
                        signupPassword.value
                    );


                /*
                    이메일 인증이 꺼져 있으면
                    즉시 session이 생성됨
                */

                if (
                    result.nativeSyncFailed
                ) {

                    if (loginEmail) {

                        loginEmail.value =
                            signupEmail.value.trim();
                    }

                    showLoginMode();

                    setAuthStatus(
                        "✅ 계정은 정상적으로 만들어졌습니다. 앱 수집기 연결을 위해 지금 한 번 로그인해 주세요."
                    );

                } else if (result.session) {

                    setAuthStatus("");

                    window.location.reload();

                } else {

                    if (loginEmail) {

                        loginEmail.value =
                            signupEmail.value.trim();
                    }

                    showLoginMode();

                    setAuthStatus(
                        "✅ 계정이 만들어졌습니다. 자동 로그인이 되지 않아 한 번 로그인해 주세요."
                    );
                }

            } catch (error) {

                console.error(
                    "회원가입 실패:",
                    error
                );


                const rawMessage =
                    String(
                        error?.message
                        ?? ""
                    )
                    .toLowerCase();


                if (
                    rawMessage.includes(
                        "already registered"
                    )
                    ||
                    rawMessage.includes(
                        "user already registered"
                    )
                ) {

                    if (loginEmail) {

                        loginEmail.value =
                            signupEmail.value.trim();
                    }

                    showLoginMode();

                    setAuthStatus(
                        "이미 만들어진 계정입니다. 방금 입력한 비밀번호로 로그인해 주세요.",
                        true
                    );

                } else if (
                    rawMessage.includes(
                        "password"
                    )
                    &&
                    (
                        rawMessage.includes(
                            "least"
                        )
                        ||
                        rawMessage.includes(
                            "weak"
                        )
                        ||
                        rawMessage.includes(
                            "characters"
                        )
                    )
                ) {

                    setAuthStatus(
                        "비밀번호 조건을 충족하지 못했습니다. 더 길고 복잡한 비밀번호로 다시 시도해 주세요.",
                        true
                    );

                } else if (
                    rawMessage.includes(
                        "rate limit"
                    )
                    ||
                    rawMessage.includes(
                        "too many"
                    )
                ) {

                    setAuthStatus(
                        "회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
                        true
                    );

                } else if (
                    rawMessage.includes(
                        "signup"
                    )
                    &&
                    rawMessage.includes(
                        "disabled"
                    )
                ) {

                    setAuthStatus(
                        "현재 회원가입이 비활성화되어 있습니다.",
                        true
                    );

                } else {

                    const detail =
                        String(
                            error?.message
                            ?? ""
                        )
                        .trim();

                    setAuthStatus(
                        detail
                            ?
                            `회원가입 오류: ${detail}`
                            :
                            "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.",
                        true
                    );
                }

            } finally {

                if (signupButton) {

                    signupButton.disabled =
                        false;
                }
            }
        }
    );
}

/* =========================================
   로그아웃
========================================= */

const logoutButton =
    document.querySelector(
        "#logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut();

                window.location.reload(); 

            } catch (error) {

                console.error(
                    "로그아웃 실패:",
                    error
                );

                alert(
                    "로그아웃 중 오류가 발생했습니다."
                );
            }

        }
    );
}

/* =========================================
   실행
========================================= */

initializeAuthentication();
