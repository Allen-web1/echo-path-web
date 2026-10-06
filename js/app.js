/* =========================================
   Echo Path
   Main Application
========================================= */


/* =========================================
   1. 다른 JavaScript 파일 가져오기
========================================= */
import {
    startEchoPathRealtime
} from "./realtime.js";

import {
    supabase
} from "./supabase.js";

import {
    loadEchoPathUsageData
} from "./supabase-data.js";

import "./auth-ui.js";

import {
    calculateDDI
} from "./ddi.js";


import {
    renderStatistics
} from "./charts.js";

import {
    renderDigitalCity
} from "./city3d.js";

console.log(
    "Echo Path 시작"
);


/* =========================================
   실제 Supabase 데이터 준비
========================================= */

function createEmptyUsageData() {

    const empty24Hours =
        () =>
            Array(
                24
            ).fill(
                0
            );


    return {

        date:
            "",

        totalUsageHours:
            0,

        appSwitchCount:
            0,

        categorySwitchCount:
            0,

        repeatLoopCount:
            0,

        apps:
            [],

        timeline:
            [],

        repeatLoops:
            [],

        transitions:
            [],

        periodUsage: {

            daily: {
                label: "오늘",
                categories: {}
            },

            weekly: {
                label: "최근 7일",
                categories: {}
            },

            monthly: {
                label: "최근 30일",
                categories: {}
            }

        },

        heatmap: {

            days: [
                "일",
                "월",
                "화",
                "수",
                "목",
                "금",
                "토"
            ],

            values:
                Array.from(
                    {
                        length: 7
                    },
                    empty24Hours
                )

        },

        ddiHeatmap: {

            days: [
                "일",
                "월",
                "화",
                "수",
                "목",
                "금",
                "토"
            ],

            values:
                Array.from(
                    {
                        length: 7
                    },
                    empty24Hours
                )

        },

        ddiHourlyDetails:
            [],

        selfAwarenessComparison: {
            hasAssessment: false,
            daily: null,
            weekly: null,
            monthly: null
        },

        weeklyReport: {

            currentWeek: {
                days: []
            },

            previousWeek: {
                averageDdi: 0
            }

        },

        monthlyReport: {

            currentMonth: {
                label: "",
                weeks: []
            },

            previousMonth: {
                averageDdi: 0
            }

        }

    };

}


let usageData =
    createEmptyUsageData();


try {

    usageData =
        await loadEchoPathUsageData();

    console.log(
        "Echo Path 실제 데이터 연결 성공:",
        usageData
    );
    
}

catch (error) {

    /*
        로그인 화면에서는 아직 사용 데이터가 없어도
        정상입니다.

        로그인 후 페이지가 새로고침되면
        해당 계정의 실제 데이터를 다시 불러옵니다.
    */

    console.warn(
        "실제 사용 데이터 대기:",
        error?.message
        ?? error
    );

}


/* =========================================
   2. 페이지 요소 가져오기
========================================= */

const pages =
    document.querySelectorAll(
        ".page"
    );


const navButtons =
    document.querySelectorAll(
        ".nav-button[data-page-target]"
    );


const pageTargetButtons =
    document.querySelectorAll(
        "[data-page-target]"
    );


/* =========================================
   3. 화면 전환 함수
========================================= */

function openPage(
    pageId
) {

    pages.forEach(
        (page) => {

            page.classList.remove(
                "active-page"
            );

        }
    );


    const targetPage =
        document.getElementById(
            pageId
        );


    if (!targetPage) {

        console.error(
            `페이지를 찾을 수 없습니다: ${pageId}`
        );

        return;

    }


    targetPage.classList.add(
        "active-page"
    );


    /*
        다른 기기에서 실행한 AI 분석 결과가 있을 수 있으므로
        리포트 페이지 진입 시 Supabase 최신 상태를 다시 읽습니다.
    */
    if (
        pageId === "reportPage"
    ) {

        void refreshEchoPathDataFromRealtime({
            source:
                "report-page-open"
        });

    }


    /* =====================================
       DDI 페이지 최초 진입 시
       실제 데이터로 3D 도시 생성
    ===================================== */

    if (
        pageId === "mapPage"
        &&
        !document.querySelector(
            "#digitalCitySection"
        )
    ) {

        renderDigitalCity(
            usageData
        );

    }


    navButtons.forEach(
        (button) => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.pageTarget
                === pageId
            ) {

                button.classList.add(
                    "active"
                );

            }

        }
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   4. 버튼 클릭 시 화면 이동
========================================= */

pageTargetButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const pageId =
                    button.dataset.pageTarget;


                openPage(
                    pageId
                );

            }
        );

    }
);


/* =========================================
   5. 기본 화면 요소 가져오기
========================================= */

const totalUsageElement =
    document.querySelector(
        "#totalUsage"
    );


const ddiValueElement =
    document.querySelector(
        "#ddiValue"
    );


const mainDdiValueElement =
    document.querySelector(
        "#mainDdiValue"
    );


const tValueElement =
    document.querySelector(
        "#tValue"
    );


const nValueElement =
    document.querySelector(
        "#nValue"
    );


const cValueElement =
    document.querySelector(
        "#cValue"
    );


const rValueElement =
    document.querySelector(
        "#rValue"
    );


/* =========================================
   6. DDI 기여도 화면 요소 가져오기
========================================= */

const tContributionValueElement =
    document.querySelector(
        "#tContributionValue"
    );


const tContributionPercentElement =
    document.querySelector(
        "#tContributionPercent"
    );


const tContributionBarElement =
    document.querySelector(
        "#tContributionBar"
    );


const nContributionValueElement =
    document.querySelector(
        "#nContributionValue"
    );


const nContributionPercentElement =
    document.querySelector(
        "#nContributionPercent"
    );


const nContributionBarElement =
    document.querySelector(
        "#nContributionBar"
    );


const cContributionValueElement =
    document.querySelector(
        "#cContributionValue"
    );


const cContributionPercentElement =
    document.querySelector(
        "#cContributionPercent"
    );


const cContributionBarElement =
    document.querySelector(
        "#cContributionBar"
    );


const rContributionValueElement =
    document.querySelector(
        "#rContributionValue"
    );


const rContributionPercentElement =
    document.querySelector(
        "#rContributionPercent"
    );


const rContributionBarElement =
    document.querySelector(
        "#rContributionBar"
    );


const contributionInsightElement =
    document.querySelector(
        "#ddiContributionInsight"
    );


const contributionDescriptionElement =
    document.querySelector(
        "#ddiContributionDescription"
    );


/* =========================================
   7. DDI 계산
========================================= */

let ddiResult =
    calculateDDI(
        usageData
    );


/* =========================================
   8. 시간 표시 형식 변환
========================================= */

function formatHours(
    hours
) {

    const wholeHours =
        Math.floor(
            hours
        );


    const minutes =
        Math.round(
            (
                hours
                -
                wholeHours
            )
            * 60
        );


    return (
        `${wholeHours}h `
        +
        `${String(
            minutes
        ).padStart(
            2,
            "0"
        )}m`
    );

}


/* =========================================
   9. 홈 화면 표시
========================================= */

if (totalUsageElement) {

    totalUsageElement.textContent =
        formatHours(
            usageData.totalUsageHours
        );

}


if (ddiValueElement) {

    ddiValueElement.textContent =
        `${ddiResult.ddi} km`;

}


/* =========================================
   10. DDI 화면 기본 데이터 표시
========================================= */

if (mainDdiValueElement) {

    mainDdiValueElement.textContent =
        `${ddiResult.ddi} km`;

}


if (tValueElement) {

    tValueElement.textContent =
        `${ddiResult.T} h`;

}


if (nValueElement) {

    nValueElement.textContent =
        ddiResult.N;

}


if (cValueElement) {

    cValueElement.textContent =
        ddiResult.C;

}


if (rValueElement) {

    rValueElement.textContent =
        ddiResult.R;

}


/* =========================================
   11. DDI 기여도 표시 함수
========================================= */

function renderContribution(
    contribution,
    valueElement,
    percentElement,
    barElement
) {

    if (
        !valueElement
        ||
        !percentElement
        ||
        !barElement
    ) {

        return;

    }


    valueElement.textContent =
        `${contribution.value.toFixed(1)} km`;


    percentElement.textContent =
        `${contribution.percent.toFixed(1)}%`;


    barElement.style.width =
        `${contribution.percent}%`;

}


/* =========================================
   12. T / N / C / R 기여도 표시
========================================= */

renderContribution(
    ddiResult.contributions.T,
    tContributionValueElement,
    tContributionPercentElement,
    tContributionBarElement
);


renderContribution(
    ddiResult.contributions.N,
    nContributionValueElement,
    nContributionPercentElement,
    nContributionBarElement
);


renderContribution(
    ddiResult.contributions.C,
    cContributionValueElement,
    cContributionPercentElement,
    cContributionBarElement
);


renderContribution(
    ddiResult.contributions.R,
    rContributionValueElement,
    rContributionPercentElement,
    rContributionBarElement
);


/* =========================================
   13. 가장 큰 DDI 원인 자동 분석
========================================= */

function renderContributionInsight() {

    if (
        !contributionInsightElement
        ||
        !contributionDescriptionElement
    ) {

        return;

    }


    const contributionData = [

        {
            key: "T",
            label: "사용시간",
            data:
                ddiResult
                    .contributions
                    .T
        },

        {
            key: "N",
            label: "앱 전환",
            data:
                ddiResult
                    .contributions
                    .N
        },

        {
            key: "C",
            label: "카테고리 전환",
            data:
                ddiResult
                    .contributions
                    .C
        },

        {
            key: "R",
            label: "반복 순환",
            data:
                ddiResult
                    .contributions
                    .R
        }

    ];


    const largestContribution =
        [...contributionData]
            .sort(
                (a, b) =>
                    b.data.value
                    -
                    a.data.value
            )[0];


    contributionInsightElement.textContent =
        `가장 큰 기여 요인: ${largestContribution.label}`;


    if (
        largestContribution.key
        === "T"
    ) {

        contributionDescriptionElement.textContent =
            "오늘의 DDI에서는 총 사용시간이 가장 큰 비중을 차지했습니다.";

    }

    else if (
        largestContribution.key
        === "N"
    ) {

        contributionDescriptionElement.textContent =
            "오늘은 앱을 자주 전환한 행동이 DDI 증가에 가장 크게 기여했습니다.";

    }

    else if (
        largestContribution.key
        === "C"
    ) {

        contributionDescriptionElement.textContent =
            "오늘은 서로 다른 활동 카테고리 사이의 이동이 DDI 증가에 가장 크게 기여했습니다.";

    }

    else if (
        largestContribution.key
        === "R"
    ) {

        contributionDescriptionElement.textContent =
            "오늘은 짧은 시간 안에 반복된 앱 순환 패턴이 DDI 증가에 가장 크게 기여했습니다.";

    }

}


renderContributionInsight();


/* =========================================
   14. 통계 화면 생성
========================================= */

renderStatistics(
    usageData
);


/* =========================================
   15. 개발 확인용 Console
========================================= */

console.log(
    "사용 데이터:",
    usageData
);


console.log(
    "DDI 계산 결과:",
    ddiResult
);


/* =========================================
   16. AI 목표 + 어제·오늘 실제 행동 변화 비교
========================================= */

const compareUserADdiElement =
    document.querySelector("#compareUserADdi");
const compareUserATElement =
    document.querySelector("#compareUserAT");
const compareUserANElement =
    document.querySelector("#compareUserAN");
const compareUserACElement =
    document.querySelector("#compareUserAC");
const compareUserARElement =
    document.querySelector("#compareUserAR");

const compareUserBDdiElement =
    document.querySelector("#compareUserBDdi");
const compareUserBTElement =
    document.querySelector("#compareUserBT");
const compareUserBNElement =
    document.querySelector("#compareUserBN");
const compareUserBCElement =
    document.querySelector("#compareUserBC");
const compareUserBRElement =
    document.querySelector("#compareUserBR");

const compareBeforeLabelElement =
    document.querySelector("#compareBeforeLabel");
const compareAfterLabelElement =
    document.querySelector("#compareAfterLabel");

const compareDdiDifferenceElement =
    document.querySelector("#compareDdiDifference");
const compareDdiExplanationElement =
    document.querySelector("#compareDdiExplanation");

const aiGoalTitleElement =
    document.querySelector("#aiGoalTitle");
const aiGoalDescriptionElement =
    document.querySelector("#aiGoalDescription");
const aiGoalTargetElement =
    document.querySelector("#aiGoalTarget");
const aiGoalProgressElement =
    document.querySelector("#aiGoalProgress");
const aiGoalBaselineElement =
    document.querySelector("#aiGoalBaseline");
const aiGoalDateElement =
    document.querySelector("#aiGoalDate");


function formatComparisonDate(
    dateString,
    suffix = ""
) {

    const parts =
        String(
            dateString
            ?? ""
        )
            .split("-")
            .map(
                Number
            );


    if (
        parts.length !== 3
        ||
        !parts[1]
        ||
        !parts[2]
    ) {

        return suffix || "-";

    }


    return `${parts[1]}월 ${parts[2]}일${suffix}`;

}


function formatComparisonHours(
    hours
) {

    const totalMinutes =
        Math.max(
            0,
            Math.round(
                Number(
                    hours
                    ?? 0
                )
                *
                60
            )
        );


    const wholeHours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    if (
        wholeHours > 0
    ) {

        return `${wholeHours}시간 ${minutes}분`;

    }


    return `${minutes}분`;

}


function setChallengeCompareValues(
    prefix,
    snapshot
) {

    const isBefore =
        prefix === "before";


    const ddiElement =
        isBefore
            ? compareUserADdiElement
            : compareUserBDdiElement;

    const tElement =
        isBefore
            ? compareUserATElement
            : compareUserBTElement;

    const nElement =
        isBefore
            ? compareUserANElement
            : compareUserBNElement;

    const cElement =
        isBefore
            ? compareUserACElement
            : compareUserBCElement;

    const rElement =
        isBefore
            ? compareUserARElement
            : compareUserBRElement;


    if (
        !snapshot
    ) {

        if (ddiElement) ddiElement.textContent = "-";
        if (tElement) tElement.textContent = "-";
        if (nElement) nElement.textContent = "-";
        if (cElement) cElement.textContent = "-";
        if (rElement) rElement.textContent = "-";

        return;

    }


    if (ddiElement) {
        ddiElement.textContent =
            `${Number(snapshot.ddi ?? 0).toFixed(1)} km`;
    }

    if (tElement) {
        tElement.textContent =
            formatComparisonHours(
                snapshot.totalUsageHours
            );
    }

    if (nElement) {
        nElement.textContent =
            `${Number(snapshot.appSwitchCount ?? 0)}회`;
    }

    if (cElement) {
        cElement.textContent =
            `${Number(snapshot.categorySwitchCount ?? 0)}회`;
    }

    if (rElement) {
        rElement.textContent =
            `${Number(snapshot.repeatLoopCount ?? 0)}회`;
    }

}


function getDailyCategoryRatio(
    target
) {

    const categories =
        usageData
            ?.periodUsage
            ?.daily
            ?.categories
        ?? {};


    const entries =
        Object.entries(
            categories
        )
            .map(
                ([category, minutes]) => ({
                    category,
                    minutes:
                        Math.max(
                            0,
                            Number(
                                minutes
                                ?? 0
                            )
                            || 0
                        )
                })
            );


    const totalMinutes =
        entries.reduce(
            (
                sum,
                item
            ) =>
                sum
                +
                item.minutes,
            0
        );


    if (
        totalMinutes <= 0
    ) {

        return null;

    }


    let targetMinutes =
        0;


    if (
        target
        ===
        "learning_use_ratio"
    ) {

        targetMinutes =
            entries
                .filter(
                    (item) =>
                        item.category
                        ===
                        "학습"
                )
                .reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum
                        +
                        item.minutes,
                    0
                );

    }

    else if (
        target
        ===
        "entertainment_use_ratio"
    ) {

        const entertainmentCategories =
            new Set([
                "SNS",
                "미디어",
                "게임"
            ]);


        targetMinutes =
            entries
                .filter(
                    (item) =>
                        entertainmentCategories.has(
                            item.category
                        )
                )
                .reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum
                        +
                        item.minutes,
                    0
                );

    }

    else {

        return null;

    }


    return Number(
        (
            targetMinutes
            /
            totalMinutes
            *
            100
        ).toFixed(
            1
        )
    );

}


function getCurrentChallengeMetricValue(
    metric,
    todaySnapshot
) {

    if (
        !todaySnapshot
    ) {

        return null;

    }


    switch (
        metric
    ) {

        case "n_switches":
            return Number(
                todaySnapshot.appSwitchCount
                ?? 0
            );

        case "r_repeat_loops":
            return Number(
                todaySnapshot.repeatLoopCount
                ?? 0
            );

        case "average_usage_minutes":
            return Number(
                (
                    Number(
                        todaySnapshot.totalUsageHours
                        ?? 0
                    )
                    *
                    60
                ).toFixed(
                    1
                )
            );

        case "learning_use_ratio":
        case "entertainment_use_ratio":
            return getDailyCategoryRatio(
                metric
            );

        case "ddi":
            return Number(
                todaySnapshot.ddi
                ?? 0
            );

        default:
            return null;

    }

}


function renderAiGoal(
    todaySnapshot
) {

    const challenge =
        usageData
            ?.currentChallenge
        ?? null;


    if (
        !challenge
    ) {

        if (aiGoalTitleElement) {
            aiGoalTitleElement.textContent =
                "리포트에서 AI 분석을 실행하면 목표가 생성됩니다.";
        }

        if (aiGoalDescriptionElement) {
            aiGoalDescriptionElement.textContent =
                "Gemini가 최신 T·N·C·R·DDI와 이용 패턴을 분석한 뒤 측정 가능한 행동 목표를 제안합니다.";
        }

        if (aiGoalTargetElement) {
            aiGoalTargetElement.textContent =
                "-";
        }

        if (aiGoalProgressElement) {
            aiGoalProgressElement.textContent =
                "-";
        }

        if (aiGoalBaselineElement) {
            aiGoalBaselineElement.textContent =
                "-";
        }

        if (aiGoalDateElement) {
            aiGoalDateElement.textContent =
                "-";
        }

        return;

    }


    const targetMetric =
        challenge.targetMetric
        ?? "";


    const targetValue =
        challenge.targetValue;


    const currentValue =
        getCurrentChallengeMetricValue(
            targetMetric,
            todaySnapshot
        );


    if (aiGoalTitleElement) {
        aiGoalTitleElement.textContent =
            challenge.title
            ||
            "AI 행동 목표";
    }


    if (aiGoalDescriptionElement) {
        aiGoalDescriptionElement.textContent =
            challenge.description
            ||
            "Gemini가 제안한 행동 목표입니다.";
    }


    if (aiGoalTargetElement) {
        aiGoalTargetElement.textContent =
            `${formatChallengeMetricLabel(
                targetMetric
            )} · ${formatChallengeMetricValue(
                targetMetric,
                targetValue
            )}`;
    }


    if (aiGoalProgressElement) {
        aiGoalProgressElement.textContent =
            currentValue === null
                ? "오늘 데이터 수집 중"
                : `현재 ${formatChallengeMetricValue(
                    targetMetric,
                    currentValue
                )}`;
    }


    if (aiGoalBaselineElement) {
        aiGoalBaselineElement.textContent =
            formatChallengeMetricValue(
                targetMetric,
                challenge.baselineValue
            );
    }


    if (aiGoalDateElement) {
        aiGoalDateElement.textContent =
            challenge.challengeDate
                ? `${formatComparisonDate(
                    challenge.challengeDate
                )} · ${formatChallengeStatus(
                    challenge.status
                )}`
                : formatChallengeStatus(
                    challenge.status
                );
    }

}


function formatSignedChange(
    value,
    unit,
    digits = 0
) {

    const number =
        Number(
            value
            ?? 0
        );


    const fixed =
        digits > 0
            ? Math.abs(number).toFixed(
                digits
            )
            : String(
                Math.round(
                    Math.abs(
                        number
                    )
                )
            );


    if (
        number > 0
    ) {

        return `+${fixed}${unit}`;

    }


    if (
        number < 0
    ) {

        return `-${fixed}${unit}`;

    }


    return `0${unit}`;

}


function renderChallengeComparison() {

    const comparison =
        usageData
            ?.dailyBehaviorComparison
        ?? null;


    if (
        !compareUserADdiElement
        ||
        !compareUserBDdiElement
    ) {

        return;

    }


    const before =
        comparison
            ?.before
        ?? null;


    const after =
        comparison
            ?.after
        ?? null;


    if (
        compareBeforeLabelElement
    ) {

        compareBeforeLabelElement.textContent =
            comparison
                ?.beforeDate
                ? `어제 · ${formatComparisonDate(
                    comparison.beforeDate
                )}`
                : "어제";

    }


    if (
        compareAfterLabelElement
    ) {

        compareAfterLabelElement.textContent =
            comparison
                ?.afterDate
                ? `오늘 현재 · ${formatComparisonDate(
                    comparison.afterDate
                )}`
                : "오늘 현재";

    }


    setChallengeCompareValues(
        "before",
        before
    );


    setChallengeCompareValues(
        "after",
        after
    );


    renderAiGoal(
        after
    );


    if (
        !before
        ||
        !after
    ) {

        if (
            compareDdiDifferenceElement
        ) {

            if (
                !before
                &&
                after
            ) {

                compareDdiDifferenceElement.textContent =
                    "어제 저장된 일일 데이터가 없어 아직 비교할 수 없습니다.";

            }

            else if (
                before
                &&
                !after
            ) {

                compareDdiDifferenceElement.textContent =
                    "오늘 데이터가 아직 동기화되지 않았습니다.";

            }

            else {

                compareDdiDifferenceElement.textContent =
                    "어제와 오늘 데이터를 불러오는 중입니다.";

            }

        }


        if (
            compareDdiExplanationElement
        ) {

            compareDdiExplanationElement.textContent =
                "daily_metrics에 어제와 오늘 데이터가 모두 저장되면 자동으로 비교되며, 오늘 값은 Realtime 동기화 때마다 갱신됩니다.";

        }


        return;

    }


    const ddiChange =
        Number(
            (
                Number(
                    after.ddi
                    ?? 0
                )
                -
                Number(
                    before.ddi
                    ?? 0
                )
            ).toFixed(
                1
            )
        );


    const usageMinutesChange =
        Math.round(
            (
                Number(
                    after.totalUsageHours
                    ?? 0
                )
                -
                Number(
                    before.totalUsageHours
                    ?? 0
                )
            )
            *
            60
        );


    const nChange =
        Number(
            after.appSwitchCount
            ?? 0
        )
        -
        Number(
            before.appSwitchCount
            ?? 0
        );


    const cChange =
        Number(
            after.categorySwitchCount
            ?? 0
        )
        -
        Number(
            before.categorySwitchCount
            ?? 0
        );


    const rChange =
        Number(
            after.repeatLoopCount
            ?? 0
        )
        -
        Number(
            before.repeatLoopCount
            ?? 0
        );


    if (
        compareDdiDifferenceElement
    ) {

        compareDdiDifferenceElement.textContent =
            `DDI ${Number(
                before.ddi
                ?? 0
            ).toFixed(
                1
            )} km → ${Number(
                after.ddi
                ?? 0
            ).toFixed(
                1
            )} km · ${formatSignedChange(
                ddiChange,
                " km",
                1
            )}`;

    }


    if (
        compareDdiExplanationElement
    ) {

        compareDdiExplanationElement.textContent =
            `오늘 현재 기준으로 어제보다 사용시간 ${formatSignedChange(
                usageMinutesChange,
                "분"
            )}, 앱 전환 ${formatSignedChange(
                nChange,
                "회"
            )}, 카테고리 전환 ${formatSignedChange(
                cChange,
                "회"
            )}, 반복 루프 ${formatSignedChange(
                rChange,
                "회"
            )}입니다. 오늘 값은 하루가 끝날 때까지 계속 변할 수 있습니다.`;

    }


    console.log(
        "어제·오늘 실제 행동 비교:",
        comparison
    );

}


/* =========================================
   16-1. 홈 / DDI 디지털 활동 공간 실제 데이터
========================================= */

const homeActivitySpaceElement =
    document.querySelector(
        "#homeActivitySpace"
    );


const ddiActivitySpaceElement =
    document.querySelector(
        "#ddiActivitySpace"
    );


function getDailyActivitySpaceEntries() {

    const categoryObject =
        usageData
            ?.periodUsage
            ?.daily
            ?.categories
        ?? {};


    let entries =
        Object.entries(
            categoryObject
        )
            .map(
                ([category, minutes]) => ({
                    category:
                        String(
                            category
                            || "기타"
                        ),
                    minutes:
                        Math.max(
                            0,
                            Number(
                                minutes
                                ?? 0
                            )
                            || 0
                        )
                })
            )
            .filter(
                (item) =>
                    item.minutes > 0
            );


    if (
        entries.length === 0
        &&
        Array.isArray(
            usageData
                ?.apps
        )
    ) {

        const grouped =
            new Map();


        usageData.apps.forEach(
            (app) => {

                const category =
                    String(
                        app
                            ?.category
                        || "기타"
                    );


                grouped.set(
                    category,
                    (
                        grouped.get(
                            category
                        )
                        ?? 0
                    )
                    +
                    Math.max(
                        0,
                        Number(
                            app
                                ?.usageMinutes
                            ?? 0
                        )
                        || 0
                    )
                );

            }
        );


        entries =
            Array.from(
                grouped.entries()
            )
                .map(
                    ([category, minutes]) => ({
                        category,
                        minutes
                    })
                )
                .filter(
                    (item) =>
                        item.minutes > 0
                );

    }


    return entries
        .sort(
            (
                a,
                b
            ) =>
                b.minutes
                -
                a.minutes
        )
        .slice(
            0,
            4
        );

}


function getActivitySpaceColor(
    category
) {

    const colors = {
        "AI·정보":
            "#4f73ff",
        "학습":
            "#4f73ff",
        "정보·검색":
            "#4785e8",
        "생산성":
            "#4e9d8c",
        "소통":
            "#35ad6d",
        "지도·이동":
            "#3ca6a6",
        "생활·도구":
            "#6f86a8",
        "SNS":
            "#8f63df",
        "미디어":
            "#f35a5d",
        "쇼핑":
            "#f0a02e",
        "게임":
            "#e35b91",
        "기타":
            "#72809a"
    };


    return colors[
        category
    ]
    ||
    "#72809a";

}


function renderActivitySpacePreview(
    container
) {

    if (
        !container
    ) {

        return;

    }


    const entries =
        getDailyActivitySpaceEntries();


    container.innerHTML =
        "";


    container.style.display =
        "flex";

    container.style.alignItems =
        "flex-end";

    container.style.justifyContent =
        "space-around";

    container.style.gap =
        "10px";

    container.style.padding =
        "24px 16px 28px";

    container.style.boxSizing =
        "border-box";


    if (
        entries.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "p"
            );


        emptyMessage.textContent =
            "오늘 수집된 카테고리 사용 데이터가 없습니다.";


        emptyMessage.style.cssText =
            "margin:auto;text-align:center;color:#8b95a7;font-size:13px;line-height:1.5;";


        container.appendChild(
            emptyMessage
        );


        return;

    }


    const maxMinutes =
        Math.max(
            ...entries.map(
                (item) =>
                    item.minutes
            ),
            1
        );


    entries.forEach(
        (item) => {

            const bar =
                document.createElement(
                    "div"
                );


            const ratio =
                Math.min(
                    1,
                    item.minutes
                    /
                    maxMinutes
                );


            const heightPercent =
                28
                +
                Math.sqrt(
                    ratio
                )
                *
                62;


            bar.className =
                "building";


            bar.style.cssText =
                [
                    `height:${heightPercent.toFixed(1)}%`,
                    "min-height:54px",
                    "flex:1 1 0",
                    "max-width:24%",
                    `background:${getActivitySpaceColor(
                        item.category
                    )}`,
                    "position:relative",
                    "display:flex",
                    "align-items:flex-end",
                    "justify-content:center",
                    "padding:10px 4px",
                    "border-radius:14px 14px 4px 4px",
                    "box-sizing:border-box"
                ].join(
                    ";"
                );


            bar.title =
                `${item.category} · ${Math.round(
                    item.minutes
                )}분`;


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                item.category;


            label.style.cssText =
                "font-size:12px;font-weight:800;text-align:center;line-height:1.15;color:#fff;word-break:keep-all;";


            const value =
                document.createElement(
                    "small"
                );


            value.textContent =
                `${Math.round(
                    item.minutes
                )}분`;


            value.style.cssText =
                "position:absolute;top:8px;left:0;right:0;text-align:center;font-size:10px;font-weight:700;color:rgba(255,255,255,.92);";


            bar.append(
                value,
                label
            );


            container.appendChild(
                bar
            );

        }
    );

}


function renderActivitySpacePreviews() {

    renderActivitySpacePreview(
        homeActivitySpaceElement
    );


    renderActivitySpacePreview(
        ddiActivitySpaceElement
    );

}


renderChallengeComparison();
renderActivitySpacePreviews();


/* =========================================
   17. AI REPORT 데이터 연결
========================================= */


/* =========================================
   리포트 화면 요소 가져오기
========================================= */

const reportDdiValueElement =
    document.querySelector(
        "#reportDdiValue"
    );

const reportTValueElement =
    document.querySelector(
        "#reportTValue"
    );

const reportNValueElement =
    document.querySelector(
        "#reportNValue"
    );

const reportCValueElement =
    document.querySelector(
        "#reportCValue"
    );

const reportRValueElement =
    document.querySelector(
        "#reportRValue"
    );


const reportMainFactorElement =
    document.querySelector(
        "#reportMainFactor"
    );

const reportCoreAnalysisElement =
    document.querySelector(
        "#reportCoreAnalysis"
    );


const reportPatternTitleElement =
    document.querySelector(
        "#reportPatternTitle"
    );

const reportPatternDescriptionElement =
    document.querySelector(
        "#reportPatternDescription"
    );

const reportMainRouteElement =
    document.querySelector(
        "#reportMainRoute"
    );


const reportComplexTimeElement =
    document.querySelector(
        "#reportComplexTime"
    );

const reportComplexDdiElement =
    document.querySelector(
        "#reportComplexDdi"
    );

const reportComplexDescriptionElement =
    document.querySelector(
        "#reportComplexDescription"
    );


const reportChallengeTitleElement =
    document.querySelector(
        "#reportChallengeTitle"
    );

const reportChallengeDescriptionElement =
    document.querySelector(
        "#reportChallengeDescription"
    );

const reportChallengeGoalElement =
    document.querySelector(
        "#reportChallengeGoal"
    );

const reportChallengeDateElement =
    document.querySelector(
        "#reportChallengeDate"
    );

const reportChallengeBaselineElement =
    document.querySelector(
        "#reportChallengeBaseline"
    );

const reportChallengeStatusElement =
    document.querySelector(
        "#reportChallengeStatus"
    );

const reportAiAnalysisMetaElement =
    document.querySelector(
        "#reportAiAnalysisMeta"
    );

const reportLearningDirectionElement =
    document.querySelector(
        "#reportLearningDirection"
    );

const reportSolutionSuggestionsElement =
    document.querySelector(
        "#reportSolutionSuggestions"
    );


const selfAwarenessMetaElement =
    document.querySelector(
        "#selfAwarenessMeta"
    );

const selfEstimatedUsageElement =
    document.querySelector(
        "#selfEstimatedUsage"
    );

const selfActualUsageElement =
    document.querySelector(
        "#selfActualUsage"
    );

const selfUsageInsightElement =
    document.querySelector(
        "#selfUsageInsight"
    );

const selfSwitchScoreElement =
    document.querySelector(
        "#selfSwitchScore"
    );

const selfActualSwitchesElement =
    document.querySelector(
        "#selfActualSwitches"
    );

const selfCheckingScoreElement =
    document.querySelector(
        "#selfCheckingScore"
    );

const selfActualLoopsElement =
    document.querySelector(
        "#selfActualLoops"
    );

const selfLoopInsightElement =
    document.querySelector(
        "#selfLoopInsight"
    );

const selfLearningExpectedElement =
    document.querySelector(
        "#selfLearningExpected"
    );

const selfLearningActualElement =
    document.querySelector(
        "#selfLearningActual"
    );

const selfLearningInsightElement =
    document.querySelector(
        "#selfLearningInsight"
    );

const selfEntertainmentExpectedElement =
    document.querySelector(
        "#selfEntertainmentExpected"
    );

const selfEntertainmentActualElement =
    document.querySelector(
        "#selfEntertainmentActual"
    );

const selfEntertainmentInsightElement =
    document.querySelector(
        "#selfEntertainmentInsight"
    );

const selfAwarenessDdiElement =
    document.querySelector(
        "#selfAwarenessDdi"
    );

const selfAwarenessSummaryElement =
    document.querySelector(
        "#selfAwarenessSummary"
    );

const selfAwarenessPeriodButtons =
    document.querySelectorAll(
        ".self-awareness-period-button[data-self-period]"
    );

let selectedSelfAwarenessPeriod =
    "daily";



/* =========================================
   가장 큰 DDI 기여 요인 찾기
========================================= */

function getLargestDdiFactor() {

    const factors = [

        {
            key: "T",
            label: "사용시간",
            value:
                ddiResult
                    .contributions
                    .T
                    .value
        },

        {
            key: "N",
            label: "앱 전환",
            value:
                ddiResult
                    .contributions
                    .N
                    .value
        },

        {
            key: "C",
            label: "카테고리 전환",
            value:
                ddiResult
                    .contributions
                    .C
                    .value
        },

        {
            key: "R",
            label: "반복 루프",
            value:
                ddiResult
                    .contributions
                    .R
                    .value
        }

    ];


    return (
        [...factors]
            .sort(
                (a, b) =>
                    b.value
                    -
                    a.value
            )[0]
    );

}


/* =========================================
   앱 이름 / 이동 경로 표시 보정
========================================= */

function getReadableAppName(value) {
    const raw = String(value ?? "").trim();

    if (!raw) return "";

    const matchedApp = (usageData.apps ?? []).find(
        (item) =>
            item.packageName === raw
            || item.name === raw
    );

    return matchedApp?.name || raw;
}

function formatReadableRoute(route, maxItems = 5) {
    const values = Array.isArray(route)
        ? route
        : String(route ?? "")
            .split(/\s*(?:→|->|>)\s*/);

    const readable = values
        .map(getReadableAppName)
        .filter(Boolean)
        .filter((value, index, array) => index === 0 || value !== array[index - 1]);

    if (readable.length === 0) return "앱 이동 경로 정보 없음";

    if (readable.length <= maxItems) {
        return readable.join(" → ");
    }

    return `${readable.slice(0, maxItems).join(" → ")} → …`;
}

/* =========================================
   대표 앱 이동 경로 만들기
========================================= */

function getMainAppRoute() {

    const transitions =
        usageData.transitions
        ?? [];


    if (
        transitions.length
        >
        0
    ) {

        const topTransition =
            [...transitions]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            b.count
                            ?? 0
                        )
                        -
                        Number(
                            a.count
                            ?? 0
                        )
                )[0];


        const fromName =
            topTransition.fromApp
            ||
            topTransition.fromPackage
            ||
            "-";


        const toName =
            topTransition.toApp
            ||
            topTransition.toPackage
            ||
            "-";


        return formatReadableRoute([
            fromName,
            toName
        ]);

    }


    const timeline =
        usageData.timeline
        ?? [];


    if (
        timeline.length
        <
        2
    ) {

        return "-";

    }


    const apps =
        timeline.map(
            item =>
                item.app
        );


    return formatReadableRoute(
        apps
    );

}


/* =========================================
   가장 복잡한 시간대 찾기
========================================= */

function getMostComplexTime() {

    const details =
        usageData.ddiHourlyDetails
        ?? [];


    if (
        details.length
        ===
        0
    ) {

        return null;

    }


    return (
        [...details]
            .sort(
                (a, b) =>
                    b.ddi
                    -
                    a.ddi
            )[0]
    );

}


/* =========================================
   행동 패턴 분석
========================================= */

function getBehaviorPattern() {

    const N =
        ddiResult.N;

    const C =
        ddiResult.C;

    const R =
        ddiResult.R;


    if (
        R >= 4
    ) {

        return {

            title:
                "반복적인 앱 순환 패턴",

            description:
                `짧은 시간 안에 앱 사이를 반복적으로 이동한 패턴이 ${R}회 관찰되었습니다.`

        };

    }


    if (
        N >= 25
    ) {

        return {

            title:
                "빈번한 앱 전환 패턴",

            description:
                `오늘 앱 전환이 ${N}회 발생했습니다. 하나의 활동을 이어가기보다 여러 앱 사이를 자주 이동한 흐름이 나타났습니다.`

        };

    }


    if (
        C >= 8
    ) {

        return {

            title:
                "다양한 활동 영역 이동",

            description:
                `학습·소통·미디어 등 서로 다른 활동 영역 사이의 이동이 ${C}회 나타났습니다.`

        };

    }


    return {

        title:
            "비교적 안정적인 사용 흐름",

        description:
            "앱 전환과 반복 순환이 상대적으로 적어 비교적 안정적인 사용 흐름이 나타났습니다."

    };

}


/* =========================================
   임시 기본 챌린지 생성
   ※ 추후 Supabase ai_challenges 실제 데이터로 교체
========================================= */

function getRecommendedChallenge() {

    const N =
        ddiResult.N;

    const C =
        ddiResult.C;

    const R =
        ddiResult.R;


    if (
        R >= 4
    ) {

        return {

            title:
                "반복 앱 이동 줄이기",

            description:
                "자주 반복해서 이동하는 앱을 확인하고, 다음 30분 동안 한 가지 목적의 앱 사용을 유지해 보세요.",

            goal:
                `반복 루프 ${Math.max(
                    0,
                    R - 1
                )}회 이하`

        };

    }


    if (
        N >= 25
    ) {

        const targetN =
            Math.round(
                N * 0.8
            );


        return {

            title:
                "앱 전환 20% 줄이기",

            description:
                "하나의 앱을 사용할 때 목적을 끝낸 뒤 다음 앱으로 이동하는 사용 습관을 시도해 보세요.",

            goal:
                `앱 전환 ${targetN}회 이하`

        };

    }


    if (
        C >= 8
    ) {

        return {

            title:
                "한 가지 활동에 집중하기",

            description:
                "30분 동안 학습·소통·미디어 등 하나의 활동 영역만 선택해 유지해 보세요.",

            goal:
                "30분 단일 카테고리 유지"

        };

    }


    return {

        title:
            "현재 흐름 유지하기",

        description:
            "현재의 비교적 안정적인 사용 흐름을 유지하면서 불필요한 앱 전환을 계속 줄여보세요.",

        goal:
            "현재 DDI 수준 유지"

    };

}


/* =========================================
   리포트 화면 생성
========================================= */

function formatChallengeMetricLabel(metric) {

    const labels = {
        n_switches: "앱 전환 횟수(N)",
        r_repeat_loops: "반복 루프 횟수(R)",
        average_usage_minutes: "스마트폰 사용시간",
        learning_use_ratio: "학습 목적 사용 비율",
        entertainment_use_ratio: "오락 목적 사용 비율",
        ddi: "DDI"
    };

    return labels[metric] ?? metric ?? "목표 지표";
}


function formatChallengeMetricValue(metric, value) {

    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "-";
    }

    const number = Number(value);
    const formatted = Number.isInteger(number)
        ? String(number)
        : number.toFixed(1);

    if (metric === "average_usage_minutes") {
        return `${formatted}분`;
    }

    if (metric === "learning_use_ratio" || metric === "entertainment_use_ratio") {
        return `${formatted}%`;
    }

    if (metric === "ddi") {
        return `${formatted} km`;
    }

    return `${formatted}회`;
}


function formatChallengeStatus(status) {

    const labels = {
        active: "진행 중",
        completed: "달성",
        failed: "미달성",
        cancelled: "취소"
    };

    return labels[status] ?? status ?? "-";
}


function formatAiPeriod(periodType) {

    const labels = {
        daily: "일간",
        weekly: "주간",
        monthly: "월간"
    };

    return labels[periodType] ?? periodType ?? "AI";
}



function formatMinutesAsUsage(
    minutes
) {
    const total =
        Math.max(
            0,
            Math.round(
                Number(minutes)
                || 0
            )
        );

    const hours =
        Math.floor(
            total / 60
        );

    const remain =
        total % 60;

    return hours > 0
        ? `${hours}시간 ${remain}분`
        : `${remain}분`;
}


function buildRatioInterpretation(
    perceived,
    actual
) {
    if (
        actual === null
        ||
        actual === undefined
        ||
        Number.isNaN(
            Number(actual)
        )
    ) {
        return "비율을 계산할 앱 카테고리 데이터가 아직 충분하지 않습니다.";
    }

    const difference =
        Math.round(
            Number(actual)
            -
            Number(perceived)
        );

    if (
        Math.abs(
            difference
        )
        <= 10
    ) {
        return "자기인식과 실제 비율이 비교적 비슷합니다.";
    }

    return difference > 0
        ? `실제 비율이 예상보다 약 ${difference}%p 높았습니다.`
        : `실제 비율이 예상보다 약 ${Math.abs(difference)}%p 낮았습니다.`;
}


function renderSelfAwarenessComparison(
    period =
        selectedSelfAwarenessPeriod
) {
    selectedSelfAwarenessPeriod =
        period;

    selfAwarenessPeriodButtons.forEach(
        (button) => {
            button.classList.toggle(
                "active",
                button.dataset.selfPeriod
                ===
                selectedSelfAwarenessPeriod
            );
        }
    );

    const comparisonRoot =
        usageData.selfAwarenessComparison;

    const data =
        comparisonRoot?.[
            selectedSelfAwarenessPeriod
        ]
        ?? null;

    if (
        !comparisonRoot?.hasAssessment
    ) {
        if (selfAwarenessMetaElement) {
            selfAwarenessMetaElement.textContent =
                "저장된 자기인식 사전 설문이 없습니다. Android 앱에서 먼저 자기인식 설문을 제출해 주세요.";
        }

        [
            selfEstimatedUsageElement,
            selfActualUsageElement,
            selfSwitchScoreElement,
            selfActualSwitchesElement,
            selfCheckingScoreElement,
            selfActualLoopsElement,
            selfLearningExpectedElement,
            selfLearningActualElement,
            selfEntertainmentExpectedElement,
            selfEntertainmentActualElement,
            selfAwarenessDdiElement
        ].forEach(
            (element) => {
                if (element) {
                    element.textContent =
                        "-";
                }
            }
        );

        if (selfUsageInsightElement) {
            selfUsageInsightElement.textContent =
                "자기인식 설문 제출 후 비교할 수 있습니다.";
        }

        if (selfLoopInsightElement) {
            selfLoopInsightElement.textContent =
                "-";
        }

        if (selfLearningInsightElement) {
            selfLearningInsightElement.textContent =
                "-";
        }

        if (selfEntertainmentInsightElement) {
            selfEntertainmentInsightElement.textContent =
                "-";
        }

        if (selfAwarenessSummaryElement) {
            selfAwarenessSummaryElement.textContent =
                "설문 데이터가 없어 아직 비교 결과를 만들 수 없습니다.";
        }

        return;
    }

    if (!data) {
        if (selfAwarenessMetaElement) {
            selfAwarenessMetaElement.textContent =
                "선택한 기간에 비교할 실제 스마트폰 사용 데이터가 아직 없습니다.";
        }

        return;
    }

    if (selfAwarenessMetaElement) {
        selfAwarenessMetaElement.textContent =
            `${data.label} · 실제 측정 ${data.measurementDays}일 평균`;
    }

    if (selfEstimatedUsageElement) {
        selfEstimatedUsageElement.textContent =
            formatMinutesAsUsage(
                data.estimatedDailyMinutes
            );
    }

    if (selfActualUsageElement) {
        selfActualUsageElement.textContent =
            formatMinutesAsUsage(
                data.actualDailyMinutes
            );
    }

    const timeDifference =
        Number(
            data.actualDailyMinutes
        )
        -
        Number(
            data.estimatedDailyMinutes
        );

    if (selfUsageInsightElement) {
        selfUsageInsightElement.textContent =
            Math.abs(
                timeDifference
            ) <= 30
                ? "자기인식과 실제 사용시간이 비교적 비슷합니다."
                : (
                    timeDifference > 0
                        ? `실제 사용시간이 예상보다 ${Math.abs(Math.round(timeDifference))}분 많았습니다.`
                        : `실제 사용시간이 예상보다 ${Math.abs(Math.round(timeDifference))}분 적었습니다.`
                );
    }

    if (selfSwitchScoreElement) {
        selfSwitchScoreElement.textContent =
            `${data.switchingSelfScore}/5`;
    }

    if (selfActualSwitchesElement) {
        selfActualSwitchesElement.textContent =
            `${data.actualSwitchCount}회`;
    }

    if (selfCheckingScoreElement) {
        selfCheckingScoreElement.textContent =
            `${data.habitualCheckingSelfScore}/5`;
    }

    if (selfActualLoopsElement) {
        selfActualLoopsElement.textContent =
            `${data.actualRepeatLoops}회`;
    }

    if (selfLoopInsightElement) {
        selfLoopInsightElement.textContent =
            data.actualRepeatLoops === 0
                ? "측정된 반복 루프는 없었습니다."
                : `같은 앱으로 되돌아오는 반복 행동이 평균 ${data.actualRepeatLoops}회 측정되었습니다.`;
    }

    if (selfLearningExpectedElement) {
        selfLearningExpectedElement.textContent =
            `${data.perceivedLearningRatio}%`;
    }

    if (selfLearningActualElement) {
        selfLearningActualElement.textContent =
            data.actualLearningRatio === null
                ? "-"
                : `${data.actualLearningRatio}%`;
    }

    if (selfLearningInsightElement) {
        selfLearningInsightElement.textContent =
            buildRatioInterpretation(
                data.perceivedLearningRatio,
                data.actualLearningRatio
            );
    }

    if (selfEntertainmentExpectedElement) {
        selfEntertainmentExpectedElement.textContent =
            `${data.perceivedEntertainmentRatio}%`;
    }

    if (selfEntertainmentActualElement) {
        selfEntertainmentActualElement.textContent =
            data.actualEntertainmentRatio === null
                ? "-"
                : `${data.actualEntertainmentRatio}%`;
    }

    if (selfEntertainmentInsightElement) {
        selfEntertainmentInsightElement.textContent =
            buildRatioInterpretation(
                data.perceivedEntertainmentRatio,
                data.actualEntertainmentRatio
            );
    }

    if (selfAwarenessDdiElement) {
        selfAwarenessDdiElement.textContent =
            `${Number(
                data.ddi
                ?? 0
            ).toFixed(1)} km`;
    }

    if (selfAwarenessSummaryElement) {
        const statements = [];

        if (
            Math.abs(
                timeDifference
            ) > 30
        ) {
            statements.push(
                timeDifference > 0
                    ? `스마트폰 사용시간은 스스로 예상한 것보다 ${Math.abs(Math.round(timeDifference))}분 길었습니다.`
                    : `스마트폰 사용시간은 스스로 예상한 것보다 ${Math.abs(Math.round(timeDifference))}분 짧았습니다.`
            );
        }
        else {
            statements.push(
                "스마트폰 사용시간에 대한 자기인식과 실제 측정값은 비교적 비슷했습니다."
            );
        }

        if (
            data.actualLearningRatio !== null
        ) {
            const learningDifference =
                data.actualLearningRatio
                -
                data.perceivedLearningRatio;

            if (
                Math.abs(
                    learningDifference
                )
                > 10
            ) {
                statements.push(
                    learningDifference > 0
                        ? `학습 목적 사용 비율은 예상보다 ${Math.abs(learningDifference)}%p 높았습니다.`
                        : `학습 목적 사용 비율은 예상보다 ${Math.abs(learningDifference)}%p 낮았습니다.`
                );
            }
        }

        statements.push(
            `앱 전환 자기평가 ${data.switchingSelfScore}/5에 대해 실제 평균 앱 전환은 ${data.actualSwitchCount}회, 반복 루프는 ${data.actualRepeatLoops}회였습니다.`
        );

        selfAwarenessSummaryElement.textContent =
            statements.join(
                " "
            );
    }


    if (
        reportAiUnlocked
    ) {

        applyReportSelfAwarenessAiText();

    }

    else {

        maskSelfAwarenessAiInterpretation();

    }
}


selfAwarenessPeriodButtons.forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                renderSelfAwarenessComparison(
                    button.dataset.selfPeriod
                    ||
                    "daily"
                );
            }
        );
    }
);



/* =========================================
   REPORT AI BUTTON CONTROL
   - 사용자가 "AI 분석"을 눌렀을 때만 Gemini 실행
   - 핵심 분석 / Challenge / 행동 습관 / 자기인식 비교 해석을
     모두 같은 AI 분석 결과에서 표시
========================================= */

let reportAiUnlocked =
    false;

let reportAiBusy =
    false;

let reportAiButton =
    null;

let reportAiStatusElement =
    null;

let reportSelfAwarenessAiInterpretation =
    null;


/* =========================================
   저장된 오늘 AI 결과 기기간 복원
========================================= */

function restoreSavedReportAiState(
    {
        updateStatus = true
    } = {}
) {

    const aiAnalysis =
        usageData
            ?.aiAnalysis
        ?? null;


    const hasStoredAnalysis =
        Boolean(aiAnalysis)
        &&
        Boolean(
            String(
                aiAnalysis?.summary
                ?? ""
            ).trim()
        )
        &&
        Boolean(
            String(
                aiAnalysis?.habitPattern
                ?? ""
            ).trim()
        );


    if (!hasStoredAnalysis) {

        reportAiUnlocked =
            false;

        reportSelfAwarenessAiInterpretation =
            null;

        return false;

    }


    const usageDate =
        String(
            usageData?.date
            ?? ""
        ).trim();


    const analysisDate =
        String(
            aiAnalysis?.analysisDate
            ??
            aiAnalysis?.analyzedAt?.slice?.(0, 10)
            ??
            ""
        ).trim();


    if (
        usageDate
        &&
        analysisDate
        &&
        usageDate !== analysisDate
    ) {

        reportAiUnlocked =
            false;

        reportSelfAwarenessAiInterpretation =
            null;

        return false;

    }


    reportAiUnlocked =
        true;


    reportSelfAwarenessAiInterpretation =
        aiAnalysis?.selfAwarenessInterpretation
        ?? null;


    if (
        updateStatus
        &&
        reportAiStatusElement
    ) {

        reportAiStatusElement.textContent =
            "오늘 저장된 AI 분석 결과를 불러왔습니다.";

        reportAiStatusElement.dataset.state =
            "success";

    }


    return true;

}


/* =========================================
   날짜 / 숫자 보정
========================================= */

function getReportAnalysisDate() {

    const usageDate =
        String(
            usageData?.date
            ?? ""
        ).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            usageDate
        )
    ) {

        return usageDate;

    }


    const now =
        new Date();


    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function safeReportNumber(
    value,
    fallback = 0
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : fallback;

}


/* =========================================
   카테고리 비율
========================================= */

function getReportCategoryRatios() {

    const categories =
        usageData
            ?.periodUsage
            ?.daily
            ?.categories
        ?? {};


    const entries =
        Object.entries(
            categories
        )
            .map(
                ([category, minutes]) => ({
                    category,

                    minutes:
                        Math.max(
                            0,
                            safeReportNumber(
                                minutes
                            )
                        )
                })
            );


    const totalMinutes =
        entries.reduce(
            (
                sum,
                item
            ) =>
                sum
                +
                item.minutes,
            0
        );


    if (
        totalMinutes <= 0
    ) {

        return {
            learningRatio:
                null,

            entertainmentRatio:
                null
        };

    }


    const learningMinutes =
        entries
            .filter(
                (item) =>
                    item.category
                    ===
                    "학습"
            )
            .reduce(
                (
                    sum,
                    item
                ) =>
                    sum
                    +
                    item.minutes,
                0
            );


    const entertainmentCategories =
        new Set([
            "SNS",
            "미디어",
            "게임"
        ]);


    const entertainmentMinutes =
        entries
            .filter(
                (item) =>
                    entertainmentCategories.has(
                        item.category
                    )
            )
            .reduce(
                (
                    sum,
                    item
                ) =>
                    sum
                    +
                    item.minutes,
                0
            );


    return {

        learningRatio:
            Number(
                (
                    learningMinutes
                    /
                    totalMinutes
                    *
                    100
                ).toFixed(
                    1
                )
            ),

        entertainmentRatio:
            Number(
                (
                    entertainmentMinutes
                    /
                    totalMinutes
                    *
                    100
                ).toFixed(
                    1
                )
            )

    };

}


/* =========================================
   자기인식 비교 데이터 -> Gemini 입력
   일간 / 주간 / 월간 모두 함께 전달
========================================= */

function buildSelfAwarenessInputSnapshot() {

    const root =
        usageData
            ?.selfAwarenessComparison
        ?? {};


    function normalizePeriod(
        period
    ) {

        const data =
            root?.[
                period
            ]
            ?? null;


        if (
            !data
        ) {

            return null;

        }


        return {

            label:
                data.label
                ?? period,

            measurement_days:
                safeReportNumber(
                    data.measurementDays
                ),

            estimated_daily_minutes:
                safeReportNumber(
                    data.estimatedDailyMinutes
                ),

            actual_daily_minutes:
                safeReportNumber(
                    data.actualDailyMinutes
                ),

            switching_self_score:
                safeReportNumber(
                    data.switchingSelfScore
                ),

            actual_switch_count:
                safeReportNumber(
                    data.actualSwitchCount
                ),

            habitual_checking_self_score:
                safeReportNumber(
                    data.habitualCheckingSelfScore
                ),

            actual_repeat_loops:
                safeReportNumber(
                    data.actualRepeatLoops
                ),

            perceived_learning_ratio:
                safeReportNumber(
                    data.perceivedLearningRatio
                ),

            actual_learning_ratio:
                data.actualLearningRatio
                === null
                ||
                data.actualLearningRatio
                === undefined
                    ? null
                    : safeReportNumber(
                        data.actualLearningRatio
                    ),

            perceived_entertainment_ratio:
                safeReportNumber(
                    data.perceivedEntertainmentRatio
                ),

            actual_entertainment_ratio:
                data.actualEntertainmentRatio
                === null
                ||
                data.actualEntertainmentRatio
                === undefined
                    ? null
                    : safeReportNumber(
                        data.actualEntertainmentRatio
                    ),

            ddi:
                safeReportNumber(
                    data.ddi
                )

        };

    }


    return {

        has_assessment:
            Boolean(
                root
                    ?.hasAssessment
            ),

        daily:
            normalizePeriod(
                "daily"
            ),

        weekly:
            normalizePeriod(
                "weekly"
            ),

        monthly:
            normalizePeriod(
                "monthly"
            )

    };

}


/* =========================================
   perception gap
========================================= */

function buildReportPerceptionGapSnapshot() {

    const daily =
        usageData
            ?.selfAwarenessComparison
            ?.daily
        ?? null;


    if (
        !daily
    ) {

        return {

            usage_minutes_gap:
                null,

            learning_ratio_gap:
                null,

            entertainment_ratio_gap:
                null,

            summary:
                "자기인식 사전 설문 또는 실제 측정 데이터가 충분하지 않음"

        };

    }


    const usageGap =
        safeReportNumber(
            daily.actualDailyMinutes
        )
        -
        safeReportNumber(
            daily.estimatedDailyMinutes
        );


    const learningGap =
        daily.actualLearningRatio
        === null
        ||
        daily.actualLearningRatio
        === undefined
            ? null
            : (
                safeReportNumber(
                    daily.actualLearningRatio
                )
                -
                safeReportNumber(
                    daily.perceivedLearningRatio
                )
            );


    const entertainmentGap =
        daily.actualEntertainmentRatio
        === null
        ||
        daily.actualEntertainmentRatio
        === undefined
            ? null
            : (
                safeReportNumber(
                    daily.actualEntertainmentRatio
                )
                -
                safeReportNumber(
                    daily.perceivedEntertainmentRatio
                )
            );


    const parts =
        [];


    if (
        usageGap > 30
    ) {

        parts.push(
            "실제 하루 평균 사용시간이 예상보다 많음"
        );

    }

    else if (
        usageGap < -30
    ) {

        parts.push(
            "실제 하루 평균 사용시간이 예상보다 적음"
        );

    }

    else {

        parts.push(
            "예상 사용시간과 실제 사용시간이 비슷함"
        );

    }


    if (
        learningGap !== null
    ) {

        if (
            learningGap > 10
        ) {

            parts.push(
                "실제 학습 사용 비율이 예상보다 높음"
            );

        }

        else if (
            learningGap < -10
        ) {

            parts.push(
                "실제 학습 사용 비율이 예상보다 낮음"
            );

        }

        else {

            parts.push(
                "학습 사용 비율에 대한 자기인식과 실제 값이 비슷함"
            );

        }

    }


    if (
        entertainmentGap !== null
    ) {

        if (
            entertainmentGap > 10
        ) {

            parts.push(
                "실제 오락 사용 비율이 예상보다 높음"
            );

        }

        else if (
            entertainmentGap < -10
        ) {

            parts.push(
                "실제 오락 사용 비율이 예상보다 낮음"
            );

        }

        else {

            parts.push(
                "오락 사용 비율에 대한 자기인식과 실제 값이 비슷함"
            );

        }

    }


    return {

        usage_minutes_gap:
            Number(
                usageGap.toFixed(
                    1
                )
            ),

        learning_ratio_gap:
            learningGap
            === null
                ? null
                : Number(
                    learningGap.toFixed(
                        1
                    )
                ),

        entertainment_ratio_gap:
            entertainmentGap
            === null
                ? null
                : Number(
                    entertainmentGap.toFixed(
                        1
                    )
                ),

        summary:
            parts.join(
                ", "
            )

    };

}


/* =========================================
   Gemini 입력 스냅샷
========================================= */

function buildReportAiInputSnapshot() {

    const analysisDate =
        getReportAnalysisDate();


    const {
        learningRatio,
        entertainmentRatio
    } =
        getReportCategoryRatios();


    const perceptionGap =
        buildReportPerceptionGapSnapshot();


    const totalUsageMinutes =
        Math.max(
            0,
            safeReportNumber(
                usageData
                    ?.totalUsageHours
            )
            *
            60
        );


    const dailySelf =
        usageData
            ?.selfAwarenessComparison
            ?.daily
        ?? null;


    return {

        period_type:
            "daily",

        measurement_days:
            Math.max(
                1,
                safeReportNumber(
                    dailySelf
                        ?.measurementDays,
                    1
                )
            ),

        measurement_start:
            analysisDate,

        measurement_end:
            analysisDate,


        behavior_metrics: {

            average_usage_minutes:
                Number(
                    totalUsageMinutes.toFixed(
                        1
                    )
                ),

            t_hours:
                Number(
                    safeReportNumber(
                        usageData
                            ?.totalUsageHours
                    ).toFixed(
                        2
                    )
                ),

            n_switches:
                safeReportNumber(
                    usageData
                        ?.appSwitchCount
                ),

            c_category_switches:
                safeReportNumber(
                    usageData
                        ?.categorySwitchCount
                ),

            r_repeat_loops:
                safeReportNumber(
                    usageData
                        ?.repeatLoopCount
                ),

            ddi:
                safeReportNumber(
                    ddiResult
                        ?.ddi
                ),

            learning_use_ratio:
                learningRatio,

            entertainment_use_ratio:
                entertainmentRatio

        },


        self_assessment:
            dailySelf
                ? {

                    estimated_daily_minutes:
                        safeReportNumber(
                            dailySelf
                                .estimatedDailyMinutes
                        ),

                    switching_frequency:
                        safeReportNumber(
                            dailySelf
                                .switchingSelfScore
                        ),

                    habitual_checking:
                        safeReportNumber(
                            dailySelf
                                .habitualCheckingSelfScore
                        ),

                    learning_use_ratio:
                        safeReportNumber(
                            dailySelf
                                .perceivedLearningRatio
                        ),

                    entertainment_use_ratio:
                        safeReportNumber(
                            dailySelf
                                .perceivedEntertainmentRatio
                        )

                }
                : null,


        perception_gap:
            perceptionGap,


        self_awareness_comparison:
            buildSelfAwarenessInputSnapshot(),


        top_apps:
            (
                usageData
                    ?.apps
                ?? []
            )
                .slice(
                    0,
                    10
                )
                .map(
                    (app) => ({

                        app_name:
                            app.name
                            ?? app.packageName
                            ?? "알 수 없는 앱",

                        category:
                            app.category
                            ?? "기타",

                        usage_minutes:
                            safeReportNumber(
                                app.usageMinutes
                            )

                    })
                ),


        top_transitions:
            (
                usageData
                    ?.transitions
                ?? []
            )
                .slice(
                    0,
                    10
                )
                .map(
                    (item) => ({

                        from_app:
                            item.fromApp
                            ?? item.fromPackage
                            ?? "",

                        to_app:
                            item.toApp
                            ?? item.toPackage
                            ?? "",

                        transition_count:
                            safeReportNumber(
                                item.count
                            )

                    })
                ),


        repeat_loops:
            (
                usageData
                    ?.repeatLoops
                ?? []
            )
                .slice(
                    0,
                    8
                )
                .map(
                    (item) => ({

                        path:
                            Array.isArray(
                                item.route
                            )
                                ? item.route.join(
                                    " → "
                                )
                                : String(
                                    item.path
                                    ?? ""
                                ),

                        loop_count:
                            safeReportNumber(
                                item.count
                            )

                    })
                ),


        /*
            전날 실제 행동과 가장 최근 Challenge 평가 결과를
            오늘 Gemini 분석에 함께 전달합니다.
        */
        previous_day_behavior:
            usageData
                ?.dailyBehaviorComparison
                ?.before
                ? {

                    date:
                        usageData.dailyBehaviorComparison.beforeDate
                        ?? null,

                    total_usage_hours:
                        safeReportNumber(
                            usageData.dailyBehaviorComparison.before.totalUsageHours
                        ),

                    n_switches:
                        safeReportNumber(
                            usageData.dailyBehaviorComparison.before.appSwitchCount
                        ),

                    c_category_switches:
                        safeReportNumber(
                            usageData.dailyBehaviorComparison.before.categorySwitchCount
                        ),

                    r_repeat_loops:
                        safeReportNumber(
                            usageData.dailyBehaviorComparison.before.repeatLoopCount
                        ),

                    ddi:
                        safeReportNumber(
                            usageData.dailyBehaviorComparison.before.ddi
                        )

                }
                : null,


        eeg:
            null,


        previous_challenge:
            usageData
                ?.challengeComparison
                ? {

                    challenge_date:
                        usageData.challengeComparison.challengeDate
                        ?? null,

                    title:
                        usageData.challengeComparison.title
                        ?? "",

                    target_metric:
                        usageData.challengeComparison.targetMetric
                        ?? "",

                    target_value:
                        usageData.challengeComparison.targetValue
                        ?? null,

                    result_value:
                        usageData.challengeComparison.resultValue
                        ?? null,

                    status:
                        usageData.challengeComparison.status
                        ?? "",

                    success:
                        usageData.challengeComparison.success
                        ?? null,

                    evaluation_summary:
                        usageData.challengeComparison.evaluationSummary
                        ?? "",

                    next_recommendation:
                        usageData.challengeComparison.nextRecommendation
                        ?? ""

                }
                : null

    };

}


/* =========================================
   Edge Function v2 캐시 확인
========================================= */

function parseReportPerceptionGapEnvelope(
    value
) {

    if (
        typeof value !== "string"
        ||
        !value.trim()
    ) {

        return null;

    }


    try {

        const parsed =
            JSON.parse(
                value
            );


        if (
            parsed
            &&
            typeof parsed === "object"
        ) {

            return parsed;

        }

    }

    catch (
        error
    ) {

        return null;

    }


    return null;

}


function hasCompleteSelfAwarenessAiInterpretation(
    value
) {

    if (
        !value
        ||
        typeof value !== "object"
    ) {

        return false;

    }


    const periods = [
        "daily",
        "weekly",
        "monthly"
    ];


    const fields = [
        "usage_insight",
        "checking_insight",
        "learning_insight",
        "entertainment_insight",
        "overall_summary"
    ];


    return periods.every(
        (period) => {

            const item =
                value[
                    period
                ];


            return (
                item
                &&
                fields.every(
                    (field) =>
                        typeof item[field]
                        ===
                        "string"
                        &&
                        item[field].trim()
                )
            );

        }
    );

}



/* =========================================
   AI 입력 데이터 fingerprint

   - 입력 데이터가 같으면 저장된 Gemini 결과 재사용
   - 입력 데이터가 달라지면 새 Gemini 분석 실행
========================================= */

function stableStringifyReportAiInput(
    value
) {

    if (
        value === null
        ||
        typeof value !== "object"
    ) {

        return JSON.stringify(
            value
        );

    }


    if (
        Array.isArray(
            value
        )
    ) {

        return (
            "["
            +
            value
                .map(
                    (item) =>
                        stableStringifyReportAiInput(
                            item
                        )
                )
                .join(
                    ","
                )
            +
            "]"
        );

    }


    const keys =
        Object.keys(
            value
        )
            .sort();


    return (
        "{"
        +
        keys
            .map(
                (key) =>
                    (
                        JSON.stringify(
                            key
                        )
                        +
                        ":"
                        +
                        stableStringifyReportAiInput(
                            value[
                                key
                            ]
                        )
                    )
            )
            .join(
                ","
            )
        +
        "}"
    );

}


function createReportAiInputFingerprint(
    value
) {

    const source =
        stableStringifyReportAiInput(
            value
        );


    let hash =
        2166136261;


    for (
        let index = 0;
        index < source.length;
        index += 1
    ) {

        hash ^=
            source.charCodeAt(
                index
            );


        hash =
            Math.imul(
                hash,
                16777619
            );

    }


    return (
        "fnv1a32:"
        +
        (
            hash
            >>>
            0
        )
            .toString(
                16
            )
            .padStart(
                8,
                "0"
            )
    );

}


/* =========================================
   오늘 AI 분석 입력 행 준비
========================================= */

async function ensureDailyReportAiInput() {

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabase
            .auth
            .getSession();


    if (
        sessionError
    ) {

        throw sessionError;

    }


    const user =
        sessionData
            ?.session
            ?.user
        ?? null;


    if (
        !user
    ) {

        throw new Error(
            "로그인 정보를 확인할 수 없습니다."
        );

    }


    const analysisDate =
        getReportAnalysisDate();


    /*
        AI 분석 버튼을 누른 바로 그 시점의 최신 데이터를 만든다.
        이전 Gemini 분석 때의 데이터와 fingerprint가 같을 때만
        저장된 AI 결과를 재사용한다.
    */

    const inputSnapshot =
        buildReportAiInputSnapshot();


    const currentInputFingerprint =
        createReportAiInputFingerprint(
            inputSnapshot
        );


    const perceptionGapText =
        inputSnapshot
            ?.perception_gap
            ?.summary
        ??
        "자기인식 비교 데이터 준비 완료";


    const {
        data: existingRows,
        error: readError
    } =
        await supabase
            .from(
                "ai_analysis"
            )
            .select(
                "id, analyzed_at, summary, habit_pattern, learning_direction, solution_suggestions, perception_gap, created_at"
            )
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "analysis_date",
                analysisDate
            )
            .eq(
                "period_type",
                "daily"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            )
            .limit(
                1
            );


    if (
        readError
    ) {

        throw readError;

    }


    const existing =
        existingRows
            ?.[0]
        ?? null;


    const envelope =
        parseReportPerceptionGapEnvelope(
            existing
                ?.perception_gap
        );


    const cachedInterpretation =
        envelope
            ?.self_awareness_interpretation
        ?? null;


    const analyzedInputFingerprint =
        typeof envelope
            ?.analyzed_input_fingerprint
        ===
        "string"
            ? envelope
                .analyzed_input_fingerprint
            : null;


    const hasSameInput =
        Boolean(
            analyzedInputFingerprint
        )
        &&
        analyzedInputFingerprint
        ===
        currentInputFingerprint;


    const hasReusableCache =
        hasSameInput
        &&
        Boolean(
            existing
                ?.analyzed_at
        )
        &&
        Boolean(
            existing
                ?.summary
        )
        &&
        Boolean(
            existing
                ?.habit_pattern
        )
        &&
        Boolean(
            existing
                ?.learning_direction
        )
        &&
        Boolean(
            existing
                ?.solution_suggestions
        )
        &&
        hasCompleteSelfAwarenessAiInterpretation(
            cachedInterpretation
        );


    if (
        hasReusableCache
    ) {

        return {
            user,
            analysisId:
                existing.id,
            cached:
                true,
            dataChanged:
                false,
            inputFingerprint:
                currentInputFingerprint
        };

    }


    /*
        데이터가 달라졌다면 최신 input_snapshot을 저장한다.

        analyzed_input_fingerprint는 마지막 실제 Gemini 분석 때의
        fingerprint를 그대로 보존한다. Edge Function은
        current fingerprint와 analyzed fingerprint가 다르면
        Gemini를 새로 호출한다.
    */

    const nextEnvelope = {

        __echo_path_ai_version:
            3,

        base_summary:
            perceptionGapText,

        input_fingerprint:
            currentInputFingerprint,

        analyzed_input_fingerprint:
            analyzedInputFingerprint,

        self_awareness_interpretation:
            hasCompleteSelfAwarenessAiInterpretation(
                cachedInterpretation
            )
                ? cachedInterpretation
                : null

    };


    if (
        existing
    ) {

        const {
            error: updateError
        } =
            await supabase
                .from(
                    "ai_analysis"
                )
                .update({

                    input_snapshot:
                        inputSnapshot,

                    perception_gap:
                        JSON.stringify(
                            nextEnvelope
                        ),

                    analysis_version:
                        3

                })
                .eq(
                    "id",
                    existing.id
                );


        if (
            updateError
        ) {

            throw updateError;

        }


        return {
            user,
            analysisId:
                existing.id,
            cached:
                false,
            dataChanged:
                true,
            inputFingerprint:
                currentInputFingerprint
        };

    }


    const {
        data: insertedRows,
        error: insertError
    } =
        await supabase
            .from(
                "ai_analysis"
            )
            .insert({

                user_id:
                    user.id,

                analysis_date:
                    analysisDate,

                period_type:
                    "daily",

                input_snapshot:
                    inputSnapshot,

                perception_gap:
                    JSON.stringify(
                        nextEnvelope
                    ),

                analysis_version:
                    3

            })
            .select(
                "id"
            )
            .limit(
                1
            );


    if (
        insertError
    ) {

        throw insertError;

    }


    return {
        user,
        analysisId:
            insertedRows
                ?.[0]
                ?.id
            ?? null,
        cached:
            false,
        dataChanged:
            true,
        inputFingerprint:
            currentInputFingerprint
    };

}


/* =========================================
   Gemini 자기인식 비교 해석 표시
========================================= */

function applyReportSelfAwarenessAiText() {

    if (
        !reportAiUnlocked
    ) {

        return;

    }


    const interpretation =
        reportSelfAwarenessAiInterpretation
            ?.[
                selectedSelfAwarenessPeriod
            ]
        ?? null;


    if (
        !interpretation
    ) {

        maskSelfAwarenessAiInterpretation();

        return;

    }


    if (
        selfUsageInsightElement
    ) {

        selfUsageInsightElement.textContent =
            interpretation
                .usage_insight
            ||
            "AI 비교 해석을 생성하지 못했습니다.";

    }


    if (
        selfLoopInsightElement
    ) {

        selfLoopInsightElement.textContent =
            interpretation
                .checking_insight
            ||
            "AI 비교 해석을 생성하지 못했습니다.";

    }


    if (
        selfLearningInsightElement
    ) {

        selfLearningInsightElement.textContent =
            interpretation
                .learning_insight
            ||
            "AI 비교 해석을 생성하지 못했습니다.";

    }


    if (
        selfEntertainmentInsightElement
    ) {

        selfEntertainmentInsightElement.textContent =
            interpretation
                .entertainment_insight
            ||
            "AI 비교 해석을 생성하지 못했습니다.";

    }


    if (
        selfAwarenessSummaryElement
    ) {

        selfAwarenessSummaryElement.textContent =
            interpretation
                .overall_summary
            ||
            "AI 비교 해석을 생성하지 못했습니다.";

    }

}


/* =========================================
   AI 버튼 전에는 AI 해석을 가림
========================================= */

function maskSelfAwarenessAiInterpretation() {

    const waitingText =
        "AI 분석을 눌러 Gemini의 비교 해석을 확인하세요.";


    [
        selfUsageInsightElement,
        selfLoopInsightElement,
        selfLearningInsightElement,
        selfEntertainmentInsightElement,
        selfAwarenessSummaryElement
    ]
        .forEach(
            (element) => {

                if (
                    element
                ) {

                    element.textContent =
                        waitingText;

                }

            }
        );

}


function maskAiGeneratedReportSections() {

    if (
        reportCoreAnalysisElement
    ) {

        reportCoreAnalysisElement.textContent =
            "AI 분석을 눌러 오늘의 핵심 분석을 확인하세요.";

    }


    if (
        reportAiAnalysisMetaElement
    ) {

        reportAiAnalysisMetaElement.textContent =
            "AI 분석 대기";

    }


    if (
        reportLearningDirectionElement
    ) {

        reportLearningDirectionElement.textContent =
            "AI 분석 후 학습 방향이 표시됩니다.";

    }


    if (
        reportSolutionSuggestionsElement
    ) {

        reportSolutionSuggestionsElement.textContent =
            "AI 분석 후 실행 가능한 해결 방법이 표시됩니다.";

    }


    if (
        reportPatternTitleElement
    ) {

        reportPatternTitleElement.textContent =
            "AI 분석 대기";

    }


    if (
        reportPatternDescriptionElement
    ) {

        reportPatternDescriptionElement.textContent =
            "AI 분석을 눌러 Gemini가 관찰한 이용 습관을 확인하세요.";

    }


    if (
        reportChallengeTitleElement
    ) {

        reportChallengeTitleElement.textContent =
            "AI 분석을 눌러 오늘의 Challenge를 생성하세요.";

    }


    if (
        reportChallengeDescriptionElement
    ) {

        reportChallengeDescriptionElement.textContent =
            "오늘의 실제 사용 데이터를 Gemini가 분석한 뒤 실천 목표를 제안합니다.";

    }


    if (
        reportChallengeGoalElement
    ) {

        reportChallengeGoalElement.textContent =
            "-";

    }


    if (
        reportChallengeDateElement
    ) {

        reportChallengeDateElement.textContent =
            "-";

    }


    if (
        reportChallengeBaselineElement
    ) {

        reportChallengeBaselineElement.textContent =
            "-";

    }


    if (
        reportChallengeStatusElement
    ) {

        reportChallengeStatusElement.textContent =
            "-";

    }


    maskSelfAwarenessAiInterpretation();

}


/* =========================================
   AI 버튼 상태
========================================= */

function setReportAiButtonState(
    {
        busy = false,
        message = "",
        state = ""
    } = {}
) {

    reportAiBusy =
        busy;


    if (
        reportAiButton
    ) {

        reportAiButton.disabled =
            busy;


        reportAiButton.textContent =
            busy
                ? "AI 분석 중..."
                : "AI 분석";

    }


    if (
        reportAiStatusElement
    ) {

        reportAiStatusElement.textContent =
            message;


        if (
            state
        ) {

            reportAiStatusElement.dataset.state =
                state;

        }

        else {

            delete reportAiStatusElement.dataset.state;

        }

    }

}


/* =========================================
   리포트 상단 AI 분석 버튼 생성
========================================= */

function setupReportAiButton() {

    if (
        document.querySelector(
            "#reportAiControl"
        )
    ) {

        reportAiButton =
            document.querySelector(
                "#runReportAiAnalysis"
            );


        reportAiStatusElement =
            document.querySelector(
                "#reportAiStatus"
            );


        return;

    }


    const focusHeading =
        document.querySelector(
            "#reportPage .report-section-heading-focus"
        );


    if (
        !focusHeading
    ) {

        return;

    }


    const control =
        document.createElement(
            "section"
        );


    control.id =
        "reportAiControl";


    control.setAttribute(
        "aria-label",
        "AI 분석 실행"
    );


    control.innerHTML = `

        <div class="report-ai-control-copy">
            <span>AI REPORT</span>

            <strong>
                오늘의 AI 분석
            </strong>

            <p>
                버튼을 누를 때만 오늘의 실제 사용 데이터와
                자기인식 설문을 Gemini가 분석합니다.
            </p>
        </div>

        <button
            id="runReportAiAnalysis"
            type="button"
        >
            AI 분석
        </button>

        <p
            id="reportAiStatus"
            aria-live="polite"
        >
            AI 분석 대기
        </p>

    `;


    control.style.cssText =
        [
            "margin:16px 0 18px",
            "padding:18px",
            "border:1px solid #dbe4ff",
            "border-radius:18px",
            "background:linear-gradient(135deg,#f8faff,#eef3ff)"
        ].join(
            ";"
        );


    const copy =
        control.querySelector(
            ".report-ai-control-copy"
        );


    if (
        copy
    ) {

        copy.style.cssText =
            "margin-bottom:14px;";

    }


    const label =
        control.querySelector(
            ".report-ai-control-copy span"
        );


    if (
        label
    ) {

        label.style.cssText =
            "display:block;font-size:11px;font-weight:800;letter-spacing:.12em;color:#4568ff;margin-bottom:4px;";

    }


    const title =
        control.querySelector(
            ".report-ai-control-copy strong"
        );


    if (
        title
    ) {

        title.style.cssText =
            "display:block;font-size:18px;color:#18233b;margin-bottom:6px;";

    }


    const description =
        control.querySelector(
            ".report-ai-control-copy p"
        );


    if (
        description
    ) {

        description.style.cssText =
            "margin:0;color:#667085;font-size:13px;line-height:1.55;";

    }


    reportAiButton =
        control.querySelector(
            "#runReportAiAnalysis"
        );


    if (
        reportAiButton
    ) {

        reportAiButton.style.cssText =
            [
                "width:100%",
                "min-height:46px",
                "border:0",
                "border-radius:13px",
                "background:#4264ff",
                "color:white",
                "font-size:15px",
                "font-weight:800",
                "cursor:pointer"
            ].join(
                ";"
            );

    }


    reportAiStatusElement =
        control.querySelector(
            "#reportAiStatus"
        );


    if (
        reportAiStatusElement
    ) {

        reportAiStatusElement.style.cssText =
            "margin:10px 0 0;text-align:center;color:#667085;font-size:12px;";

    }


    focusHeading.parentNode.insertBefore(
        control,
        focusHeading
    );


    if (
        reportAiButton
    ) {

        reportAiButton.addEventListener(
            "click",
            () => {

                runReportAiAnalysis();

            }
        );

    }

}


/* =========================================
   AI 분석 실행
========================================= */

async function runReportAiAnalysis() {

    if (
        reportAiBusy
    ) {

        return;

    }


    reportAiUnlocked =
        false;

    reportSelfAwarenessAiInterpretation =
        null;


    maskAiGeneratedReportSections();


    setReportAiButtonState({
        busy:
            true,

        message:
            "오늘의 실제 데이터와 자기인식 설문을 준비하고 있습니다."
    });


    try {

        const inputInfo =
            await ensureDailyReportAiInput();


        setReportAiButtonState({
            busy:
                true,

            message:
                inputInfo.cached
                    ? "데이터 변화가 없어 저장된 Gemini 분석 결과를 불러오고 있습니다."
                    : (
                        inputInfo.dataChanged
                            ? "바뀐 데이터를 감지했습니다. Gemini가 최신 상태를 다시 분석하고 있습니다."
                            : "Gemini가 오늘의 사용 습관과 자기인식 차이를 분석하고 있습니다."
                    )
        });


        const {
            data,
            error
        } =
            await supabase
                .functions
                .invoke(
                    "dynamic-api",
                    {
                        body: {
                            period_type:
                                "daily"
                        }
                    }
                );


        if (
            error
        ) {

            throw new Error(
                data
                    ?.message
                ||
                error
                    ?.message
                ||
                "AI 분석 호출에 실패했습니다."
            );

        }


        if (
            data
                ?.success
            !==
            true
        ) {

            throw new Error(
                data
                    ?.message
                ||
                "AI 분석 결과를 받지 못했습니다."
            );

        }


        reportSelfAwarenessAiInterpretation =
            data
                ?.self_awareness_interpretation
            ?? null;


        if (
            !hasCompleteSelfAwarenessAiInterpretation(
                reportSelfAwarenessAiInterpretation
            )
        ) {

            throw new Error(
                "Gemini 자기인식 비교 해석 결과가 완전하지 않습니다."
            );

        }


        usageData =
            await loadEchoPathUsageData();


        ddiResult =
            calculateDDI(
                usageData
            );


        reportAiUnlocked =
            true;


        renderAiReport();

        renderChallengeComparison();


        setReportAiButtonState({
            busy:
                false,

            state:
                "success",

            message:
                data.cached
                    ? "데이터 변화가 없어 기존 Gemini 분석 결과를 그대로 사용했습니다."
                    : "최신 데이터 기준으로 Gemini AI 분석을 새로 완료했습니다."
        });

    }

    catch (
        error
    ) {

        console.error(
            "리포트 AI 분석 실패:",
            error
        );


        reportAiUnlocked =
            false;

        reportSelfAwarenessAiInterpretation =
            null;


        maskAiGeneratedReportSections();


        setReportAiButtonState({
            busy:
                false,

            state:
                "error",

            message:
                error
                    ?.message
                ||
                "AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요."
        });

    }

}


function renderAiReport() {

    if (
        !reportDdiValueElement
    ) {

        return;

    }


    /* 기본 수치 */

    reportDdiValueElement.textContent =
        `${ddiResult.ddi.toFixed(1)} km`;


    if (reportTValueElement) {

        reportTValueElement.textContent =
            `${ddiResult.T} h`;

    }


    if (reportNValueElement) {

        reportNValueElement.textContent =
            `${ddiResult.N}회`;

    }


    if (reportCValueElement) {

        reportCValueElement.textContent =
            `${ddiResult.C}회`;

    }


    if (reportRValueElement) {

        reportRValueElement.textContent =
            `${ddiResult.R}회`;

    }


    renderSelfAwarenessComparison(
        selectedSelfAwarenessPeriod
    );


    /* 핵심 DDI 분석 */

    const largestFactor =
        getLargestDdiFactor();


    if (reportMainFactorElement) {

        reportMainFactorElement.textContent =
            `${largestFactor.key} · ${largestFactor.label}`;

    }


    const aiAnalysis =
        usageData.aiAnalysis;


    if (reportCoreAnalysisElement) {

        reportCoreAnalysisElement.textContent =
            aiAnalysis?.summary
            || "저장된 AI 분석 결과가 아직 없습니다. AI 분석을 실행하면 이곳에 실제 분석 결과가 표시됩니다.";

    }


    if (reportAiAnalysisMetaElement) {

        const periodLabel =
            formatAiPeriod(
                aiAnalysis?.periodType
            );

        const analysisDate =
            aiAnalysis?.analysisDate
            || aiAnalysis?.analyzedAt?.slice?.(0, 10)
            || "-";

        reportAiAnalysisMetaElement.textContent =
            aiAnalysis
                ? `${periodLabel} · ${analysisDate}`
                : "AI 분석 기록 없음";

    }


    if (reportLearningDirectionElement) {

        reportLearningDirectionElement.textContent =
            aiAnalysis?.learningDirection
            || "AI 분석이 생성되면 학습 방향이 표시됩니다.";

    }


    if (reportSolutionSuggestionsElement) {

        reportSolutionSuggestionsElement.textContent =
            aiAnalysis?.solutionSuggestions
            || "AI 분석이 생성되면 실행 가능한 해결 방법이 표시됩니다.";

    }


    /* 행동 패턴 */

    const pattern =
        getBehaviorPattern();


    if (reportPatternTitleElement) {

        reportPatternTitleElement.textContent =
            aiAnalysis
                ? "AI가 관찰한 이용 습관"
                : pattern.title;

    }


    if (reportPatternDescriptionElement) {

        reportPatternDescriptionElement.textContent =
            aiAnalysis?.habitPattern
            || pattern.description;

    }


    if (reportMainRouteElement) {

        reportMainRouteElement.textContent =
            getMainAppRoute();

    }


    /* 가장 복잡한 시간 */

    const complexTime =
        getMostComplexTime();


    if (
        complexTime
    ) {

        const startTime =
            String(
                complexTime.startHour
            ).padStart(
                2,
                "0"
            );


        const endTime =
            String(
                complexTime.endHour
            ).padStart(
                2,
                "0"
            );


        if (reportComplexTimeElement) {

            reportComplexTimeElement.textContent =
                `${startTime}:00 ~ ${endTime}:00`;

        }


        if (reportComplexDdiElement) {

            reportComplexDdiElement.textContent =
                `${complexTime.ddi.toFixed(1)} km`;

        }


        const routeText =
            formatReadableRoute(
                complexTime.route,
                5
            );


        if (reportComplexDescriptionElement) {

            reportComplexDescriptionElement.textContent =
                `${routeText} 흐름에서 앱 전환 ${complexTime.appSwitchCount ?? 0}회, 카테고리 전환 ${complexTime.categorySwitchCount ?? 0}회, 반복 루프 ${complexTime.repeatLoopCount ?? 0}회가 나타났습니다.`;

        }

    }

    else {

        if (reportComplexTimeElement) {

            reportComplexTimeElement.textContent =
                "-";

        }


        if (reportComplexDdiElement) {

            reportComplexDdiElement.textContent =
                "-";

        }


        if (reportComplexDescriptionElement) {

            reportComplexDescriptionElement.textContent =
                "시간대별 실제 DDI 데이터가 아직 없습니다.";

        }

    }


    /* Supabase 실제 Challenge */

    const challenge =
        usageData.currentChallenge;


    if (reportChallengeTitleElement) {

        reportChallengeTitleElement.textContent =
            challenge?.title
            || "생성된 AI Challenge가 아직 없습니다.";

    }


    if (reportChallengeDescriptionElement) {

        reportChallengeDescriptionElement.textContent =
            challenge?.description
            || "일간 AI 분석을 실행하면 Challenge가 생성되고 이곳에 표시됩니다.";

    }


    if (reportChallengeGoalElement) {

        reportChallengeGoalElement.textContent =
            challenge
                ? `${formatChallengeMetricLabel(challenge.targetMetric)} · ${formatChallengeMetricValue(challenge.targetMetric, challenge.targetValue)}`
                : "-";

    }


    if (reportChallengeDateElement) {

        reportChallengeDateElement.textContent =
            challenge?.challengeDate
            ?? "-";

    }


    if (reportChallengeBaselineElement) {

        reportChallengeBaselineElement.textContent =
            challenge
                ? formatChallengeMetricValue(
                    challenge.targetMetric,
                    challenge.baselineValue
                )
                : "-";

    }


    if (reportChallengeStatusElement) {

        reportChallengeStatusElement.textContent =
            formatChallengeStatus(
                challenge?.status
            );

    }


    if (
        reportAiUnlocked
    ) {

        applyReportSelfAwarenessAiText();

    }

    else {

        maskAiGeneratedReportSections();

    }


    console.log(
        "Echo Path AI 분석 / Challenge 화면 반영:",
        {
            aiAnalysis,
            challenge
        }
    );

}


/* =========================================
   리포트 생성 실행
========================================= */

setupReportAiButton();

restoreSavedReportAiState();

renderAiReport();


console.log(
    "AI 리포트 기본 화면 생성 완료"
);


/* =========================================
   18. WEEKLY / MONTHLY REPORT
========================================= */


/* =========================================
   주간 리포트 화면 요소
========================================= */

const weeklyChangeBadgeElement =
    document.querySelector(
        "#weeklyChangeBadge"
    );

const weeklyAverageDdiElement =
    document.querySelector(
        "#weeklyAverageDdi"
    );

const weeklyAverageUsageElement =
    document.querySelector(
        "#weeklyAverageUsage"
    );

const weeklyMostComplexDayElement =
    document.querySelector(
        "#weeklyMostComplexDay"
    );

const weeklyMostComplexDdiElement =
    document.querySelector(
        "#weeklyMostComplexDdi"
    );

const weeklyMostStableDayElement =
    document.querySelector(
        "#weeklyMostStableDay"
    );

const weeklyMostStableDdiElement =
    document.querySelector(
        "#weeklyMostStableDdi"
    );

const weeklyReportInsightElement =
    document.querySelector(
        "#weeklyReportInsight"
    );


/* =========================================
   월간 리포트 화면 요소
========================================= */

const monthlyChangeBadgeElement =
    document.querySelector(
        "#monthlyChangeBadge"
    );

const monthlyAverageDdiElement =
    document.querySelector(
        "#monthlyAverageDdi"
    );

const monthlyAverageUsageElement =
    document.querySelector(
        "#monthlyAverageUsage"
    );

const monthlyMostComplexWeekElement =
    document.querySelector(
        "#monthlyMostComplexWeek"
    );

const monthlyMostComplexDdiElement =
    document.querySelector(
        "#monthlyMostComplexDdi"
    );

const monthlyMostStableWeekElement =
    document.querySelector(
        "#monthlyMostStableWeek"
    );

const monthlyMostStableDdiElement =
    document.querySelector(
        "#monthlyMostStableDdi"
    );

const monthlyReportInsightElement =
    document.querySelector(
        "#monthlyReportInsight"
    );


/* =========================================
   분 → 시간 / 분 표시
========================================= */

function formatMinutesForReport(
    totalMinutes
) {

    const hours =
        Math.floor(
            totalMinutes
            /
            60
        );


    const minutes =
        Math.round(
            totalMinutes
            %
            60
        );


    if (
        hours === 0
    ) {

        return `${minutes}분`;

    }


    if (
        minutes === 0
    ) {

        return `${hours}시간`;

    }


    return (
        `${hours}시간 ${minutes}분`
    );

}


/* =========================================
   평균 계산
========================================= */

function calculateAverage(
    values
) {

    if (
        !Array.isArray(
            values
        )
        ||
        values.length === 0
    ) {

        return 0;

    }


    const total =
        values.reduce(
            (
                sum,
                value
            ) =>
                sum
                +
                Number(
                    value
                    ?? 0
                ),
            0
        );


    return (
        total
        /
        values.length
    );

}


/* =========================================
   변화율 계산
========================================= */

function calculateChangePercent(
    currentValue,
    previousValue
) {

    if (
        previousValue === 0
    ) {

        return 0;

    }


    return (
        (
            currentValue
            -
            previousValue
        )
        /
        previousValue
        *
        100
    );

}


/* =========================================
   변화율 표시
========================================= */

function formatChangePercent(
    percent
) {

    const rounded =
        Number(
            percent.toFixed(
                1
            )
        );


    if (
        rounded > 0
    ) {

        return `+${rounded}%`;

    }


    if (
        rounded < 0
    ) {

        return `${rounded}%`;

    }


    return "0.0%";

}

/* =========================================
   주간 리포트 생성
========================================= */

function renderWeeklyReport() {

    const weeklyReport =
        usageData.weeklyReport;


    if (
        !weeklyReport
        ||
        !weeklyAverageDdiElement
    ) {

        return;

    }


    const currentDays =
        weeklyReport
            ?.currentWeek
            ?.days
        ??
        [];


    if (
        currentDays.length === 0
    ) {

        if (weeklyAverageDdiElement) {
            weeklyAverageDdiElement.textContent =
                "-";
        }

        if (weeklyAverageUsageElement) {
            weeklyAverageUsageElement.textContent =
                "-";
        }

        if (weeklyMostComplexDayElement) {
            weeklyMostComplexDayElement.textContent =
                "-";
        }

        if (weeklyMostComplexDdiElement) {
            weeklyMostComplexDdiElement.textContent =
                "-";
        }

        if (weeklyMostStableDayElement) {
            weeklyMostStableDayElement.textContent =
                "-";
        }

        if (weeklyMostStableDdiElement) {
            weeklyMostStableDdiElement.textContent =
                "-";
        }

        if (weeklyReportInsightElement) {
            weeklyReportInsightElement.textContent =
                "주간 실제 사용 데이터가 아직 충분하지 않습니다.";
        }

        return;
    }


    /*
        실제 데이터가 없는 날짜는 0으로 채워져 있을 수 있으므로
        유효한 날짜만 평균 계산에 사용
    */

    const validDays =
        currentDays.filter(
            (day) =>
                Number(
                    day.usageMinutes
                    ?? 0
                ) > 0
                ||
                Number(
                    day.ddi
                    ?? 0
                ) > 0
        );


    const calculationDays =
        validDays.length > 0
            ?
            validDays
            :
            currentDays;


    /* =====================================
       이번 주 평균 DDI
    ===================================== */

    const averageDdi =
        calculateAverage(
            calculationDays.map(
                day =>
                    Number(
                        day.ddi
                        ?? 0
                    )
            )
        );


    /* =====================================
       이번 주 평균 사용시간
    ===================================== */

    const averageUsageMinutes =
        calculateAverage(
            calculationDays.map(
                day =>
                    Number(
                        day.usageMinutes
                        ?? 0
                    )
            )
        );


    /* =====================================
       지난주와 비교
       아직 지난주 집계가 없으면 0%
    ===================================== */

    const previousAverageDdi =
        Number(
            weeklyReport
                ?.previousWeek
                ?.averageDdi
            ??
            0
        );


    const ddiChange =
        calculateChangePercent(
            averageDdi,
            previousAverageDdi
        );


    /* =====================================
       가장 복잡했던 요일
    ===================================== */

    const mostComplexDay =
        [...calculationDays]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b.ddi
                        ?? 0
                    )
                    -
                    Number(
                        a.ddi
                        ?? 0
                    )
            )[0];


    /* =====================================
       가장 안정적이었던 요일
    ===================================== */

    const mostStableDay =
        [...calculationDays]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.ddi
                        ?? 0
                    )
                    -
                    Number(
                        b.ddi
                        ?? 0
                    )
            )[0];


    /* =====================================
       화면 표시
    ===================================== */

    if (weeklyAverageDdiElement) {

        weeklyAverageDdiElement.textContent =
            `${averageDdi.toFixed(1)} km`;

    }


    if (weeklyAverageUsageElement) {

        weeklyAverageUsageElement.textContent =
            formatMinutesForReport(
                averageUsageMinutes
            );

    }


    if (weeklyChangeBadgeElement) {

        weeklyChangeBadgeElement.textContent =
            previousAverageDdi > 0
                ?
                formatChangePercent(
                    ddiChange
                )
                :
                "비교 준비 중";

    }


    if (weeklyMostComplexDayElement) {

        weeklyMostComplexDayElement.textContent =
            mostComplexDay
                ?
                `${mostComplexDay.day}요일`
                :
                "-";

    }


    if (weeklyMostComplexDdiElement) {

        weeklyMostComplexDdiElement.textContent =
            mostComplexDay
                ?
                `${Number(
                    mostComplexDay.ddi
                    ?? 0
                ).toFixed(1)} km`
                :
                "-";

    }


    if (weeklyMostStableDayElement) {

        weeklyMostStableDayElement.textContent =
            mostStableDay
                ?
                `${mostStableDay.day}요일`
                :
                "-";

    }


    if (weeklyMostStableDdiElement) {

        weeklyMostStableDdiElement.textContent =
            mostStableDay
                ?
                `${Number(
                    mostStableDay.ddi
                    ?? 0
                ).toFixed(1)} km`
                :
                "-";

    }


    /* =====================================
       자동 해석
    ===================================== */

    if (!weeklyReportInsightElement) {

        return;

    }


    if (
        previousAverageDdi <= 0
    ) {

        weeklyReportInsightElement.textContent =
            `최근 7일 중 실제 데이터가 있는 ${calculationDays.length}일을 기준으로 평균 DDI는 ${averageDdi.toFixed(1)} km입니다. 지난주 비교 데이터가 쌓이면 변화율도 함께 표시됩니다.`;

        return;

    }


    if (
        ddiChange < 0
    ) {

        weeklyReportInsightElement.textContent =
            `이번 주 평균 DDI는 지난주보다 ${Math.abs(
                ddiChange
            ).toFixed(
                1
            )}% 낮아졌습니다. 가장 복잡했던 날은 ${mostComplexDay?.day ?? "-"}요일이었고, 가장 안정적인 날은 ${mostStableDay?.day ?? "-"}요일이었습니다.`;

    }

    else if (
        ddiChange > 0
    ) {

        weeklyReportInsightElement.textContent =
            `이번 주 평균 DDI는 지난주보다 ${ddiChange.toFixed(
                1
            )}% 높아졌습니다. ${mostComplexDay?.day ?? "-"}요일에 디지털 이동 복잡도가 가장 높게 나타났습니다.`;

    }

    else {

        weeklyReportInsightElement.textContent =
            "이번 주 평균 DDI는 지난주와 비슷한 수준으로 나타났습니다.";

    }

}


/* =========================================
   월간 리포트 생성
========================================= */

function renderMonthlyReport() {

    const monthlyReport =
        usageData.monthlyReport;


    if (
        !monthlyReport
        ||
        !monthlyAverageDdiElement
    ) {

        return;

    }


    const weeks =
        monthlyReport
            ?.currentMonth
            ?.weeks
        ??
        [];


    if (
        weeks.length === 0
    ) {

        if (monthlyAverageDdiElement) {
            monthlyAverageDdiElement.textContent =
                "-";
        }

        if (monthlyAverageUsageElement) {
            monthlyAverageUsageElement.textContent =
                "-";
        }

        if (monthlyMostComplexWeekElement) {
            monthlyMostComplexWeekElement.textContent =
                "-";
        }

        if (monthlyMostComplexDdiElement) {
            monthlyMostComplexDdiElement.textContent =
                "-";
        }

        if (monthlyMostStableWeekElement) {
            monthlyMostStableWeekElement.textContent =
                "-";
        }

        if (monthlyMostStableDdiElement) {
            monthlyMostStableDdiElement.textContent =
                "-";
        }

        if (monthlyReportInsightElement) {
            monthlyReportInsightElement.textContent =
                "월간 실제 사용 데이터가 아직 충분하지 않습니다.";
        }

        return;
    }


    /* =====================================
       이번 달 평균 DDI
    ===================================== */

    const averageDdi =
        calculateAverage(
            weeks.map(
                week =>
                    Number(
                        week.averageDdi
                        ?? 0
                    )
            )
        );


    /* =====================================
       이번 달 평균 사용시간
    ===================================== */

    const averageUsageMinutes =
        calculateAverage(
            weeks.map(
                week =>
                    Number(
                        week.averageUsageMinutes
                        ?? 0
                    )
            )
        );


    /* =====================================
       지난달과 비교
    ===================================== */

    const previousAverageDdi =
        Number(
            monthlyReport
                ?.previousMonth
                ?.averageDdi
            ??
            0
        );


    const ddiChange =
        calculateChangePercent(
            averageDdi,
            previousAverageDdi
        );


    /* =====================================
       가장 복잡했던 주
    ===================================== */

    const mostComplexWeek =
        [...weeks]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b.averageDdi
                        ?? 0
                    )
                    -
                    Number(
                        a.averageDdi
                        ?? 0
                    )
            )[0];


    /* =====================================
       가장 안정적이었던 주
    ===================================== */

    const mostStableWeek =
        [...weeks]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.averageDdi
                        ?? 0
                    )
                    -
                    Number(
                        b.averageDdi
                        ?? 0
                    )
            )[0];


    /* =====================================
       화면 표시
    ===================================== */

    if (monthlyAverageDdiElement) {

        monthlyAverageDdiElement.textContent =
            `${averageDdi.toFixed(1)} km`;

    }


    if (monthlyAverageUsageElement) {

        monthlyAverageUsageElement.textContent =
            formatMinutesForReport(
                averageUsageMinutes
            );

    }


    if (monthlyChangeBadgeElement) {

        monthlyChangeBadgeElement.textContent =
            previousAverageDdi > 0
                ?
                formatChangePercent(
                    ddiChange
                )
                :
                "비교 준비 중";

    }


    if (monthlyMostComplexWeekElement) {

        monthlyMostComplexWeekElement.textContent =
            mostComplexWeek
                ?.week
            ??
            "-";

    }


    if (monthlyMostComplexDdiElement) {

        monthlyMostComplexDdiElement.textContent =
            mostComplexWeek
                ?
                `${Number(
                    mostComplexWeek.averageDdi
                    ?? 0
                ).toFixed(1)} km`
                :
                "-";

    }


    if (monthlyMostStableWeekElement) {

        monthlyMostStableWeekElement.textContent =
            mostStableWeek
                ?.week
            ??
            "-";

    }


    if (monthlyMostStableDdiElement) {

        monthlyMostStableDdiElement.textContent =
            mostStableWeek
                ?
                `${Number(
                    mostStableWeek.averageDdi
                    ?? 0
                ).toFixed(1)} km`
                :
                "-";

    }


    /* =====================================
       자동 해석
    ===================================== */

    if (!monthlyReportInsightElement) {

        return;

    }


    if (
        previousAverageDdi <= 0
    ) {

        monthlyReportInsightElement.textContent =
            `${monthlyReport?.currentMonth?.label ?? "이번 달"} 실제 데이터를 기준으로 평균 DDI는 ${averageDdi.toFixed(1)} km입니다. 지난달 비교 데이터가 쌓이면 변화율도 함께 표시됩니다.`;

        return;

    }


    if (
        ddiChange < 0
    ) {

        monthlyReportInsightElement.textContent =
            `이번 달 평균 DDI는 지난달보다 ${Math.abs(
                ddiChange
            ).toFixed(
                1
            )}% 낮아졌습니다. ${mostStableWeek?.week ?? "-"}에 가장 안정적인 디지털 사용 흐름이 나타났습니다.`;

    }

    else if (
        ddiChange > 0
    ) {

        monthlyReportInsightElement.textContent =
            `이번 달 평균 DDI는 지난달보다 ${ddiChange.toFixed(
                1
            )}% 높아졌습니다. ${mostComplexWeek?.week ?? "-"}에 디지털 이동 복잡도가 가장 높았습니다.`;

    }

    else {

        monthlyReportInsightElement.textContent =
            "이번 달 평균 DDI는 지난달과 비슷한 수준으로 나타났습니다.";

    }

}


/* =========================================
   주간 / 월간 리포트 실행
========================================= */

renderWeeklyReport();

renderMonthlyReport();


console.log(
    "주간 / 월간 실제 리포트 생성 완료"
);


/* =========================================
   19. 실제 데이터 상태 확인
========================================= */

function logRealDataSummary() {

    console.log(
        "================================="
    );

    console.log(
        "Echo Path 실제 데이터 요약"
    );

    console.log(
        "날짜:",
        usageData.date
    );

    console.log(
        "총 사용시간:",
        usageData.totalUsageHours
    );

    console.log(
        "앱 전환 N:",
        usageData.appSwitchCount
    );

    console.log(
        "카테고리 전환 C:",
        usageData.categorySwitchCount
    );

    console.log(
        "반복 루프 R:",
        usageData.repeatLoopCount
    );

    console.log(
        "앱 수:",
        usageData.apps?.length
        ?? 0
    );

    console.log(
        "이동 경로 수:",
        usageData.transitions?.length
        ?? 0
    );

    console.log(
        "반복 루프 종류:",
        usageData.repeatLoops?.length
        ?? 0
    );

    console.log(
        "================================="
    );

}


logRealDataSummary();


/* =========================================
   20. 데이터 존재 여부 안내
========================================= */

function checkTodayDataAvailability() {

    const hasTodayData =
        Number(
            usageData.totalUsageHours
            ?? 0
        ) > 0
        ||
        Number(
            usageData.appSwitchCount
            ?? 0
        ) > 0
        ||
        (
            usageData.apps
            ?.length
            ??
            0
        ) > 0;


    if (
        hasTodayData
    ) {

        console.log(
            "오늘 실제 Android 사용 데이터가 연결되었습니다."
        );

        return;

    }


    console.warn(
        "오늘 실제 사용 데이터가 없습니다. Android 수집 상태 또는 로그인 계정을 확인하세요."
    );

}


checkTodayDataAvailability();


/* =========================================
   21. Realtime 데이터 화면 반영
========================================= */

let realtimeRefreshInProgress = false;
let realtimeRefreshPending = false;


function renderRealtimeCoreUi() {

    /*
        홈 / DDI 기본 수치
    */

    if (totalUsageElement) {
        totalUsageElement.textContent =
            formatHours(
                usageData.totalUsageHours
            );
    }


    if (ddiValueElement) {
        ddiValueElement.textContent =
            `${ddiResult.ddi} km`;
    }


    if (mainDdiValueElement) {
        mainDdiValueElement.textContent =
            `${ddiResult.ddi} km`;
    }


    if (tValueElement) {
        tValueElement.textContent =
            `${ddiResult.T} h`;
    }


    if (nValueElement) {
        nValueElement.textContent =
            ddiResult.N;
    }


    if (cValueElement) {
        cValueElement.textContent =
            ddiResult.C;
    }


    if (rValueElement) {
        rValueElement.textContent =
            ddiResult.R;
    }


    /*
        DDI 기여도
    */

    renderContribution(
        ddiResult.contributions.T,
        tContributionValueElement,
        tContributionPercentElement,
        tContributionBarElement
    );

    renderContribution(
        ddiResult.contributions.N,
        nContributionValueElement,
        nContributionPercentElement,
        nContributionBarElement
    );

    renderContribution(
        ddiResult.contributions.C,
        cContributionValueElement,
        cContributionPercentElement,
        cContributionBarElement
    );

    renderContribution(
        ddiResult.contributions.R,
        rContributionValueElement,
        rContributionPercentElement,
        rContributionBarElement
    );

    renderContributionInsight();
    renderChallengeComparison();
    renderActivitySpacePreviews();


    /*
        Android Worker가 Supabase를 갱신한 뒤 홈/DDI뿐 아니라
        통계 화면도 같은 최신 usageData로 다시 그린다.
    */
    renderStatistics(
        usageData
    );


    /*
        리포트 영역도 최신 실제 데이터로 갱신
    */

    renderAiReport();
    renderWeeklyReport();
    renderMonthlyReport();


    /*
    디지털 활동 도시가 이미 열려 있으면
    최신 앱/이동/루프 데이터로 다시 생성한다.

    Realtime 갱신 전 사용자가 보고 있던 모드를 기억했다가
    도시를 다시 만든 뒤 같은 모드로 복원한다.
    */

    const currentCityMode =
        document.querySelector(
            ".city-mode-button.active"
        )
            ?.dataset
            ?.cityMode
        ?? "usage";


    if (
        document.querySelector(
            "#digitalCitySection"
        )
    ) {

        renderDigitalCity(
            usageData
        );


        const restoreModeButton =
            document.querySelector(
                `.city-mode-button[data-city-mode="${currentCityMode}"]`
            );


        if (restoreModeButton) {

            restoreModeButton.click();

        }

    }
}


async function refreshEchoPathDataFromRealtime(
    changeInfo = null
) {

    /*
        여러 Realtime 이벤트가 거의 동시에 들어와도
        중복 Supabase 조회가 겹치지 않도록 직렬화한다.
    */

    if (realtimeRefreshInProgress) {
        realtimeRefreshPending = true;
        return;
    }

    realtimeRefreshInProgress = true;

    try {

        const latestUsageData =
            await loadEchoPathUsageData();


        usageData =
            latestUsageData;


        ddiResult =
            calculateDDI(
                usageData
            );


        restoreSavedReportAiState();


        renderRealtimeCoreUi();


        console.log(
            "Echo Path Realtime 데이터 화면 반영 완료",
            {
                changeInfo,
                T: ddiResult.T,
                N: ddiResult.N,
                C: ddiResult.C,
                R: ddiResult.R,
                ddi: ddiResult.ddi,
                transitions:
                    usageData.transitions?.length
                    ?? 0
            }
        );

    }
    catch (error) {

        console.error(
            "Echo Path Realtime 데이터 갱신 실패:",
            error
        );

    }
    finally {

        realtimeRefreshInProgress = false;


        if (realtimeRefreshPending) {

            realtimeRefreshPending = false;

            /*
                직전 갱신 중 추가 DB 변경이 있었다면
                마지막 상태를 한 번 더 가져온다.
            */

            await refreshEchoPathDataFromRealtime({
                source:
                    "pending-change"
            });
        }
    }
}


async function startRealtimeAfterUiReady() {

    try {

        await startEchoPathRealtime(
            refreshEchoPathDataFromRealtime
        );

    }
    catch (error) {

        console.error(
            "Echo Path Realtime 시작 실패:",
            error
        );

    }
}


/* =========================================
   21. 앱 초기화 마무리
========================================= */

function finalizeEchoPathApp() {

    /*
        여기까지 실행되면

        1. Supabase 로그인 계정 확인
        2. 실제 Android 사용 데이터 조회
        3. DDI 계산
        4. 홈 화면
        5. 통계 화면
        6. 주간 / 월간 리포트

        기본 연결이 완료된 상태입니다.
    */

    console.log(
        "Echo Path 앱 초기화 완료"
    );

}


finalizeEchoPathApp();

await startRealtimeAfterUiReady();


/* =========================================
   기기간 동기화 보완
========================================= */

let lastCrossDeviceRefreshAt =
    0;


async function refreshCrossDeviceState(
    source
) {

    const now =
        Date.now();


    if (
        now - lastCrossDeviceRefreshAt
        <
        1500
    ) {

        return;

    }


    lastCrossDeviceRefreshAt =
        now;


    await refreshEchoPathDataFromRealtime({
        source
    });

}


window.addEventListener(
    "focus",
    () => {

        void refreshCrossDeviceState(
            "window-focus"
        );

    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (!document.hidden) {

            void refreshCrossDeviceState(
                "document-visible"
            );

        }

    }
);


/* =========================================
   END OF ECHO PATH APP
========================================= */

/* =========================================
   22. SETTINGS - 앱 카테고리 설정

   - 오늘 실제로 수집된 usageData.apps 사용
   - 앱 이름 / 패키지명 / 사용시간 표시
   - 사용자별 카테고리 변경
   - Supabase Auth user_metadata에 저장
   - 저장 후 Echo Path 전체 통계/도시 재반영
========================================= */

const categorySearchInput =
    document.querySelector(
        "#categorySearchInput"
    );

const categoryAppList =
    document.querySelector(
        "#categoryAppList"
    );

const categorySettingsStatus =
    document.querySelector(
        "#categorySettingsStatus"
    );

const saveCategorySettingsButton =
    document.querySelector(
        "#saveCategorySettings"
    );

const resetCategorySettingsButton =
    document.querySelector(
        "#resetCategorySettings"
    );

const categorySettingsPageButtons =
    document.querySelectorAll(
        '[data-page-target="categorySettingsPage"]'
    );


const SETTINGS_CATEGORY_OPTIONS = [
    "AI·정보",
    "학습",
    "정보·검색",
    "생산성",
    "소통",
    "지도·이동",
    "생활·도구",
    "SNS",
    "미디어",
    "쇼핑",
    "게임",
    "기타"
];


const SETTINGS_PURPOSE_OPTIONS = [
    {
        value: "productive",
        label: "생산적 활동"
    },
    {
        value: "entertainment",
        label: "오락 활동"
    }
];


let settingsCategoryApps =
    [];

let settingsCategoryDraft =
    {};

let settingsPurposeDraft =
    {};

let settingsAppRegistry =
    {};

let settingsCategoryUser =
    null;

let categorySettingsLoading =
    false;


/* =========================================
   상태 문구
========================================= */

function setCategorySettingsStatus(
    message,
    state = ""
) {

    if (
        !categorySettingsStatus
    ) {

        return;

    }


    categorySettingsStatus.textContent =
        message
        ?? "";


    if (
        state
    ) {

        categorySettingsStatus.dataset.state =
            state;

    }

    else {

        delete categorySettingsStatus.dataset.state;

    }

}


/* =========================================
   저장된 사용자 카테고리 읽기
========================================= */

function getSettingsCategoryOverrides(
    user
) {

    const overrides =
        user
            ?.user_metadata
            ?.app_category_overrides;


    if (
        !overrides
        ||
        typeof overrides !== "object"
        ||
        Array.isArray(
            overrides
        )
    ) {

        return {};

    }


    return {
        ...overrides
    };

}


/*
    2차 분류(생산적 활동 / 오락 활동)는
    기존 1차 카테고리와 완전히 별도의 metadata로 보관합니다.
*/
function getSettingsPurposeOverrides(
    user
) {

    const overrides =
        user
            ?.user_metadata
            ?.app_purpose_overrides;


    if (
        !overrides
        ||
        typeof overrides !== "object"
        ||
        Array.isArray(
            overrides
        )
    ) {

        return {};

    }


    return {
        ...overrides
    };

}



/*
    설정 화면에서 과거에 한 번이라도 확인된 앱을
    날짜가 바뀌어도 계속 유지하기 위한 앱 목록입니다.

    분류값 자체는 기존 metadata를 그대로 사용합니다.
    - app_category_overrides: 1차 분류
    - app_purpose_overrides: 2차 분류

    app_settings_registry에는 앱 식별용 정보(패키지명/앱 이름)만 보관합니다.
*/
function getSettingsAppRegistry(
    user
) {

    const registry =
        user
            ?.user_metadata
            ?.app_settings_registry;


    if (
        !registry
        ||
        typeof registry !== "object"
        ||
        Array.isArray(
            registry
        )
    ) {

        return {};

    }


    const normalized = {};


    Object.entries(
        registry
    ).forEach(
        (
            [
                packageName,
                value
            ]
        ) => {

            const key =
                String(
                    packageName
                    ?? ""
                )
                    .trim();


            if (
                !key
            ) {

                return;

            }


            const entry =
                (
                    value
                    &&
                    typeof value === "object"
                    &&
                    !Array.isArray(
                        value
                    )
                )
                    ? value
                    : {};


            normalized[
                key
            ] = {

                name:
                    String(
                        entry.name
                        ??
                        key
                    )

            };

        }
    );


    return normalized;
}


function buildSettingsRegistryEntry(
    app,
    previousEntry = null
) {

    const packageName =
        String(
            app
                ?.packageName
            ?? ""
        )
            .trim();


    const previous =
        (
            previousEntry
            &&
            typeof previousEntry === "object"
            &&
            !Array.isArray(
                previousEntry
            )
        )
            ? previousEntry
            : {};


    const currentName =
        String(
            app
                ?.name
            ?? ""
        )
            .trim();


    const previousName =
        String(
            previous
                ?.name
            ?? ""
        )
            .trim();


    const safeName =
        (
            currentName
            &&
            currentName !== packageName
            &&
            currentName !== "알 수 없는 앱"
        )
            ? currentName
            : (
                previousName
                ||
                packageName
                ||
                "알 수 없는 앱"
            );


    return {

        name:
            safeName

    };
}


function areSettingsRegistriesEqual(
    first,
    second
) {

    return (
        JSON.stringify(
            first
            ?? {}
        )
        ===
        JSON.stringify(
            second
            ?? {}
        )
    );
}


async function persistSettingsAppRegistryIfNeeded(
    user,
    nextRegistry
) {

    if (
        !user
    ) {

        return user;

    }


    const currentRegistry =
        getSettingsAppRegistry(
            user
        );


    if (
        areSettingsRegistriesEqual(
            currentRegistry,
            nextRegistry
        )
    ) {

        return user;

    }


    const {
        data,
        error
    } =
        await supabase
            .auth
            .updateUser({
                data: {
                    ...(
                        user
                            .user_metadata
                        ?? {}
                    ),

                    app_settings_registry: {
                        ...nextRegistry
                    }
                }
            });


    if (
        error
    ) {

        throw error;

    }


    return (
        data
            ?.user
        ??
        user
    );
}


/* =========================================
   사용시간 표시
========================================= */

function formatSettingsUsageMinutes(
    minutes
) {

    const safeMinutes =
        Math.max(
            0,
            Math.round(
                Number(
                    minutes
                    ?? 0
                )
                || 0
            )
        );


    const hours =
        Math.floor(
            safeMinutes / 60
        );


    const remain =
        safeMinutes % 60;


    if (
        hours > 0
    ) {

        return `${hours}시간 ${remain}분`;

    }


    return `${remain}분`;

}


/* =========================================
   앱 목록 화면 생성
========================================= */

function renderSettingsCategoryApps() {

    if (
        !categoryAppList
    ) {

        return;

    }


    const keyword =
        String(
            categorySearchInput
                ?.value
            ?? ""
        )
            .trim()
            .toLowerCase();


    const filteredApps =
        settingsCategoryApps
            .filter(
                (app) => {

                    if (
                        !keyword
                    ) {

                        return true;

                    }


                    const name =
                        String(
                            app.name
                            ?? ""
                        )
                            .toLowerCase();


                    const packageName =
                        String(
                            app.packageName
                            ?? ""
                        )
                            .toLowerCase();


                    return (
                        name.includes(
                            keyword
                        )
                        ||
                        packageName.includes(
                            keyword
                        )
                    );

                }
            );


    categoryAppList.innerHTML =
        "";


    if (
        filteredApps.length === 0
    ) {

        const emptyElement =
            document.createElement(
                "p"
            );


        emptyElement.className =
            "settings-empty-message";


        emptyElement.textContent =
            settingsCategoryApps.length === 0
                ? "확인된 앱이 아직 없습니다."
                : "검색 결과가 없습니다.";


        categoryAppList.appendChild(
            emptyElement
        );


        return;

    }


    filteredApps.forEach(
        (app) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "category-app-item";


            const copy =
                document.createElement(
                    "div"
                );


            copy.className =
                "category-app-copy";


            const nameElement =
                document.createElement(
                    "strong"
                );


            nameElement.textContent =
                app.name
                ||
                app.packageName
                ||
                "알 수 없는 앱";


            const packageElement =
                document.createElement(
                    "span"
                );


            packageElement.textContent =
                app.packageName
                || "";


            const usageElement =
                document.createElement(
                    "small"
                );


            usageElement.textContent =
                `오늘 ${formatSettingsUsageMinutes(
                    app.usageMinutes
                )} 사용`;


            copy.append(
                nameElement,
                packageElement,
                usageElement
            );


            /*
                1차 분류: 기존 활동 영역 카테고리
                2차 분류: 생산적 활동 / 오락 활동

                두 값은 서로 독립적으로 저장합니다.
            */

            const classificationGrid =
                document.createElement(
                    "div"
                );


            classificationGrid.className =
                "category-classification-grid";


            /* ---------- 1차 분류 ---------- */

            const categoryField =
                document.createElement(
                    "label"
                );


            categoryField.className =
                "category-classification-field";


            const categoryLabel =
                document.createElement(
                    "span"
                );


            categoryLabel.textContent =
                "1차 분류";


            const categorySelect =
                document.createElement(
                    "select"
                );


            categorySelect.className =
                "category-select";


            categorySelect.setAttribute(
                "aria-label",
                `${nameElement.textContent} 1차 분류`
            );


            const sourceCategory =
                String(
                    app.category
                    ?? "기타"
                );


            const savedCategory =
                settingsCategoryDraft[
                    app.packageName
                ];


            const selectedCategory =
                String(
                    savedCategory
                    ?? sourceCategory
                    ?? "기타"
                );


            Array.from(
                new Set(
                    [
                        ...SETTINGS_CATEGORY_OPTIONS,
                        sourceCategory,
                        selectedCategory
                    ]
                        .filter(
                            Boolean
                        )
                )
            )
                .forEach(
                    (category) => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            category;


                        option.textContent =
                            category;


                        option.selected =
                            category
                            ===
                            selectedCategory;


                        categorySelect.appendChild(
                            option
                        );

                    }
                );


            categorySelect.addEventListener(
                "change",
                () => {

                    const nextCategory =
                        String(
                            categorySelect.value
                            ?? ""
                        )
                            .trim();


                    if (
                        !nextCategory
                    ) {

                        return;

                    }


                    settingsCategoryDraft[
                        app.packageName
                    ] =
                        nextCategory;


                    setCategorySettingsStatus(
                        "변경사항이 있습니다. 저장 버튼을 눌러 주세요."
                    );

                }
            );


            categoryField.append(
                categoryLabel,
                categorySelect
            );


            /* ---------- 2차 분류 ---------- */

            const purposeField =
                document.createElement(
                    "label"
                );


            purposeField.className =
                "category-classification-field";


            const purposeLabel =
                document.createElement(
                    "span"
                );


            purposeLabel.textContent =
                "2차 분류";


            const purposeSelect =
                document.createElement(
                    "select"
                );


            purposeSelect.className =
                "category-select purpose-select";


            purposeSelect.setAttribute(
                "aria-label",
                `${nameElement.textContent} 2차 분류`
            );


            const savedPurpose =
                String(
                    settingsPurposeDraft[
                        app.packageName
                    ]
                    ?? ""
                )
                    .trim();


            /*
                기존 사용자의 동작을 깨지 않기 위해,
                2차 분류를 아직 저장하지 않은 앱은
                현재 자동 분류(activityType)를 화면 기본값으로 보여 줍니다.

                기타 등 자동 분류가 neutral인 앱은
                사용자가 직접 2차 분류를 선택할 수 있게 안내합니다.
            */
            const fallbackPurpose =
                (
                    app.activityType === "productive"
                    ||
                    app.activityType === "entertainment"
                )
                    ? app.activityType
                    : "";


            const selectedPurpose =
                savedPurpose
                ||
                fallbackPurpose;


            if (
                !selectedPurpose
            ) {

                const placeholderOption =
                    document.createElement(
                        "option"
                    );


                placeholderOption.value =
                    "";


                placeholderOption.textContent =
                    "2차 분류 선택";


                placeholderOption.disabled =
                    true;


                placeholderOption.selected =
                    true;


                purposeSelect.appendChild(
                    placeholderOption
                );

            }


            SETTINGS_PURPOSE_OPTIONS
                .forEach(
                    (purpose) => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            purpose.value;


                        option.textContent =
                            purpose.label;


                        option.selected =
                            purpose.value
                            ===
                            selectedPurpose;


                        purposeSelect.appendChild(
                            option
                        );

                    }
                );


            purposeSelect.addEventListener(
                "change",
                () => {

                    const nextPurpose =
                        String(
                            purposeSelect.value
                            ?? ""
                        )
                            .trim();


                    if (
                        nextPurpose !== "productive"
                        &&
                        nextPurpose !== "entertainment"
                    ) {

                        return;

                    }


                    settingsPurposeDraft[
                        app.packageName
                    ] =
                        nextPurpose;


                    setCategorySettingsStatus(
                        "변경사항이 있습니다. 저장 버튼을 눌러 주세요."
                    );

                }
            );


            purposeField.append(
                purposeLabel,
                purposeSelect
            );


            classificationGrid.append(
                categoryField,
                purposeField
            );


            item.append(
                copy,
                classificationGrid
            );


            categoryAppList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   오늘 사용한 앱 목록 불러오기
========================================= */

async function loadSettingsCategoryApps() {

    if (
        !categoryAppList
        ||
        categorySettingsLoading
    ) {

        return;

    }


    categorySettingsLoading =
        true;


    categoryAppList.innerHTML =
        '<p class="settings-empty-message">앱 목록을 불러오는 중입니다.</p>';


    setCategorySettingsStatus(
        "저장된 앱 분류와 현재 사용 앱을 확인하는 중입니다."
    );


    try {

        /*
            현재 실제 사용 앱은 usageData.apps에서 가져옵니다.
            이 값은 오늘 데이터이므로, 설정 화면 목록 자체는
            아래 app_settings_registry와 합쳐서 누적 유지합니다.
        */

        const sourceApps =
            Array.isArray(
                usageData
                    ?.apps
            )
                ? usageData.apps
                : [];


        const currentApps =
            sourceApps
                .map(
                    (app) => ({

                        packageName:
                            String(
                                app
                                    ?.packageName
                                ?? ""
                            )
                                .trim(),

                        name:
                            String(
                                app
                                    ?.name
                                ??
                                app
                                    ?.packageName
                                ??
                                "알 수 없는 앱"
                            ),

                        category:
                            String(
                                app
                                    ?.category
                                ??
                                "기타"
                            ),

                        activityType:
                            String(
                                app
                                    ?.activityType
                                ??
                                "neutral"
                            ),

                        usageMinutes:
                            Number(
                                app
                                    ?.usageMinutes
                                ??
                                0
                            )
                            || 0

                    })
                )
                .filter(
                    (app) =>
                        Boolean(
                            app.packageName
                        )
                );


        const {
            data,
            error
        } =
            await supabase
                .auth
                .getSession();


        if (
            error
        ) {

            throw error;

        }


        settingsCategoryUser =
            data
                ?.session
                ?.user
            ?? null;


        settingsCategoryDraft =
            getSettingsCategoryOverrides(
                settingsCategoryUser
            );


        settingsPurposeDraft =
            getSettingsPurposeOverrides(
                settingsCategoryUser
            );


        const storedRegistry =
            getSettingsAppRegistry(
                settingsCategoryUser
            );


        const nextRegistry = {
            ...storedRegistry
        };


        /*
            기존 버전에서 이미 1차/2차 분류를 저장한 앱도
            registry 도입 첫날부터 설정 목록에서 빠지지 않게 복원합니다.

            과거 앱의 실제 이름을 알 수 없는 경우에는
            packageName을 임시 표시명으로 사용하고,
            해당 앱을 다시 사용하면 실제 앱 이름으로 자동 보정됩니다.
        */

        const knownPackageNames =
            new Set([
                ...Object.keys(
                    nextRegistry
                ),
                ...Object.keys(
                    settingsCategoryDraft
                ),
                ...Object.keys(
                    settingsPurposeDraft
                )
            ]);


        knownPackageNames.forEach(
            (packageName) => {

                const key =
                    String(
                        packageName
                        ?? ""
                    )
                        .trim();


                if (
                    !key
                ) {

                    return;

                }


                if (
                    !nextRegistry[
                        key
                    ]
                ) {

                    nextRegistry[
                        key
                    ] = {

                        name:
                            key

                    };

                }

            }
        );


        /*
            오늘 새로 확인된 앱은 registry에 추가하고,
            과거에 있던 앱을 다시 사용한 경우에는 앱 이름 등의
            표시 정보를 최신 실제 값으로 보정합니다.
        */

        currentApps.forEach(
            (app) => {

                nextRegistry[
                    app.packageName
                ] =
                    buildSettingsRegistryEntry(
                        app,
                        nextRegistry[
                            app.packageName
                        ]
                    );

            }
        );


        settingsAppRegistry =
            nextRegistry;


        /*
            사용자가 별도로 저장 버튼을 누르지 않아도
            한 번 확인된 앱 자체는 즉시 계정 metadata에 보존합니다.
            분류 설정값은 기존 저장 버튼 동작을 그대로 유지합니다.
        */

        settingsCategoryUser =
            await persistSettingsAppRegistryIfNeeded(
                settingsCategoryUser,
                settingsAppRegistry
            );


        const currentAppMap =
            new Map(
                currentApps.map(
                    (app) => [
                        app.packageName,
                        app
                    ]
                )
            );


        settingsCategoryApps =
            Object.entries(
                settingsAppRegistry
            )
                .map(
                    (
                        [
                            packageName,
                            registryEntry
                        ]
                    ) => {

                        const currentApp =
                            currentAppMap.get(
                                packageName
                            );


                        const savedCategory =
                            settingsCategoryDraft[
                                packageName
                            ];


                        const savedPurpose =
                            settingsPurposeDraft[
                                packageName
                            ];


                        return {

                            packageName,

                            name:
                                String(
                                    currentApp
                                        ?.name
                                    ??
                                    registryEntry
                                        ?.name
                                    ??
                                    packageName
                                ),

                            category:
                                String(
                                    savedCategory
                                    ??
                                    currentApp
                                        ?.category
                                    ??
                                    "기타"
                                ),

                            activityType:
                                String(
                                    savedPurpose
                                    ??
                                    currentApp
                                        ?.activityType
                                    ??
                                    "neutral"
                                ),

                            usageMinutes:
                                Number(
                                    currentApp
                                        ?.usageMinutes
                                    ??
                                    0
                                )
                                || 0

                        };

                    }
                )
                .filter(
                    (app) =>
                        Boolean(
                            app.packageName
                        )
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const usageDifference =
                            b.usageMinutes
                            -
                            a.usageMinutes;


                        if (
                            usageDifference !== 0
                        ) {

                            return usageDifference;

                        }


                        return String(
                            a.name
                        ).localeCompare(
                            String(
                                b.name
                            ),
                            "ko"
                        );

                    }
                );


        /*
            기존 사용자는 2차 분류 metadata가 아직 없을 수 있습니다.
            현재 자동 분류가 productive / entertainment로 명확한 앱은
            화면에 보이는 값과 저장 값이 일치하도록 draft에만 기본값을 채웁니다.

            이렇게 하면 이후 1차 분류를 바꾸더라도,
            저장된 2차 분류는 독립적으로 유지됩니다.
        */

        settingsCategoryApps.forEach(
            (app) => {

                if (
                    settingsPurposeDraft[
                        app.packageName
                    ]
                ) {

                    return;

                }


                if (
                    app.activityType === "productive"
                    ||
                    app.activityType === "entertainment"
                ) {

                    settingsPurposeDraft[
                        app.packageName
                    ] =
                        app.activityType;

                }

            }
        );


        renderSettingsCategoryApps();


        setCategorySettingsStatus(
            settingsCategoryApps.length > 0
                ? `${settingsCategoryApps.length}개 앱을 불러왔습니다. 과거에 확인된 앱도 계속 유지됩니다.`
                : "확인된 앱이 아직 없습니다.",
            settingsCategoryApps.length > 0
                ? "success"
                : ""
        );

    }

    catch (
        error
    ) {

        console.error(
            "앱 카테고리 목록 불러오기 실패:",
            error
        );


        categoryAppList.innerHTML =
            '<p class="settings-empty-message">앱 목록을 표시하지 못했습니다.</p>';


        setCategorySettingsStatus(
            "앱 목록을 표시하지 못했습니다. 다시 시도해 주세요.",
            "error"
        );

    }

    finally {

        categorySettingsLoading =
            false;

    }

}


/* =========================================
   사용자 카테고리 저장
========================================= */

async function saveSettingsCategories() {

    if (
        saveCategorySettingsButton
    ) {

        saveCategorySettingsButton.disabled =
            true;

    }


    setCategorySettingsStatus(
        "카테고리 설정을 저장하는 중입니다."
    );


    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase
                .auth
                .getSession();


        if (
            sessionError
        ) {

            throw sessionError;

        }


        const user =
            sessionData
                ?.session
                ?.user
            ?? settingsCategoryUser
            ?? null;


        if (
            !user
        ) {

            throw new Error(
                "로그인 정보를 확인할 수 없습니다."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .auth
                .updateUser({
                    data: {
                        ...(
                            user
                                .user_metadata
                            ?? {}
                        ),

                        app_category_overrides: {
                            ...settingsCategoryDraft
                        },

                        app_purpose_overrides: {
                            ...settingsPurposeDraft
                        },

                        app_settings_registry: {
                            ...settingsAppRegistry
                        }
                    }
                });


        if (
            error
        ) {

            throw error;

        }


        settingsCategoryUser =
            data
                ?.user
            ?? user;


        setCategorySettingsStatus(
            "저장되었습니다. 변경한 1차·2차 분류를 전체 화면에 반영합니다.",
            "success"
        );


        /*
            supabase-data.js가 사용자 메타데이터를 다시 읽어
            통계 / 리포트 / DDI 도시에 같은 분류를 적용하도록 새로고침
        */

        window.setTimeout(
            () => {

                window.location.reload();

            },
            650
        );

    }

    catch (
        error
    ) {

        console.error(
            "앱 카테고리 저장 실패:",
            error
        );


        setCategorySettingsStatus(
            error
                ?.message
            ||
            "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
            "error"
        );

    }

    finally {

        if (
            saveCategorySettingsButton
        ) {

            saveCategorySettingsButton.disabled =
                false;

        }

    }

}


/* =========================================
   사용자 분류 초기화
========================================= */

async function resetSettingsCategories() {

    const confirmed =
        window.confirm(
            "직접 설정한 앱의 1차·2차 분류를 모두 초기화할까요?\n\n원본 사용 데이터와 T·N·C·R·DDI 값은 삭제되지 않습니다."
        );


    if (
        !confirmed
    ) {

        return;

    }


    if (
        resetCategorySettingsButton
    ) {

        resetCategorySettingsButton.disabled =
            true;

    }


    setCategorySettingsStatus(
        "사용자 분류를 초기화하는 중입니다."
    );


    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase
                .auth
                .getSession();


        if (
            sessionError
        ) {

            throw sessionError;

        }


        const user =
            sessionData
                ?.session
                ?.user
            ?? null;


        if (
            !user
        ) {

            throw new Error(
                "로그인 정보를 확인할 수 없습니다."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .auth
                .updateUser({
                    data: {
                        ...(
                            user
                                .user_metadata
                            ?? {}
                        ),

                        app_category_overrides:
                            {},

                        app_purpose_overrides:
                            {}

                        /*
                            app_settings_registry는 지우지 않습니다.
                            분류를 초기화해도 과거에 한 번 확인된 앱 목록은
                            설정 화면에 계속 남아 있어야 합니다.
                        */
                    }
                });


        if (
            error
        ) {

            throw error;

        }


        settingsCategoryUser =
            data
                ?.user
            ?? user;


        settingsCategoryDraft =
            {};


        settingsPurposeDraft =
            {};


        setCategorySettingsStatus(
            "사용자 분류를 초기화했습니다.",
            "success"
        );


        window.setTimeout(
            () => {

                window.location.reload();

            },
            650
        );

    }

    catch (
        error
    ) {

        console.error(
            "앱 카테고리 초기화 실패:",
            error
        );


        setCategorySettingsStatus(
            error
                ?.message
            ||
            "초기화하지 못했습니다.",
            "error"
        );

    }

    finally {

        if (
            resetCategorySettingsButton
        ) {

            resetCategorySettingsButton.disabled =
                false;

        }

    }

}


/* =========================================
   이벤트 연결
========================================= */

categorySettingsPageButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                loadSettingsCategoryApps();

            }
        );

    }
);


if (
    categorySearchInput
) {

    categorySearchInput.addEventListener(
        "input",
        renderSettingsCategoryApps
    );

}


if (
    saveCategorySettingsButton
) {

    saveCategorySettingsButton.addEventListener(
        "click",
        () => {

            saveSettingsCategories();

        }
    );

}


if (
    resetCategorySettingsButton
) {

    resetCategorySettingsButton.addEventListener(
        "click",
        () => {

            resetSettingsCategories();

        }
    );

}


/*
    브라우저 뒤로가기 등으로 페이지가 이미 열려 있는 상태에서
    스크립트가 다시 초기화되는 경우에도 목록을 표시합니다.
*/

if (
    document
        .querySelector(
            "#categorySettingsPage"
        )
        ?.classList
        .contains(
            "active-page"
        )
) {

    loadSettingsCategoryApps();

}

