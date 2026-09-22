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
   16. Challenge 전·후 실제 행동 변화 비교
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

const compareDdiDifferenceElement =
    document.querySelector("#compareDdiDifference");
const compareDdiExplanationElement =
    document.querySelector("#compareDdiExplanation");


function setChallengeCompareValues(prefix, snapshot) {
    const isBefore = prefix === "before";

    const ddiElement = isBefore ? compareUserADdiElement : compareUserBDdiElement;
    const tElement = isBefore ? compareUserATElement : compareUserBTElement;
    const nElement = isBefore ? compareUserANElement : compareUserBNElement;
    const cElement = isBefore ? compareUserACElement : compareUserBCElement;
    const rElement = isBefore ? compareUserARElement : compareUserBRElement;

    if (!snapshot) {
        if (ddiElement) ddiElement.textContent = "-";
        if (tElement) tElement.textContent = "-";
        if (nElement) nElement.textContent = "-";
        if (cElement) cElement.textContent = "-";
        if (rElement) rElement.textContent = "-";
        return;
    }

    if (ddiElement) ddiElement.textContent = `${snapshot.ddi.toFixed(1)} km`;
    if (tElement) tElement.textContent = `${snapshot.totalUsageHours.toFixed(2)}시간`;
    if (nElement) nElement.textContent = `${snapshot.appSwitchCount}회`;
    if (cElement) cElement.textContent = `${snapshot.categorySwitchCount}회`;
    if (rElement) rElement.textContent = `${snapshot.repeatLoopCount}회`;
}


function renderChallengeComparison() {
    const comparison = usageData.challengeComparison;

    if (!compareUserADdiElement || !compareUserBDdiElement) {
        return;
    }

    if (!comparison) {
        setChallengeCompareValues("before", null);
        setChallengeCompareValues("after", null);

        if (compareDdiDifferenceElement) {
            compareDdiDifferenceElement.textContent =
                "완료된 Challenge가 생기면 실제 전·후 데이터를 비교합니다.";
        }

        if (compareDdiExplanationElement) {
            compareDdiExplanationElement.textContent =
                "Challenge 수행 전날과 수행일의 실제 T/N/C/R/DDI를 사용합니다.";
        }
        return;
    }

    setChallengeCompareValues("before", comparison.before);
    setChallengeCompareValues("after", comparison.after);

    if (!comparison.hasFullComparison) {
        if (compareDdiDifferenceElement) {
            compareDdiDifferenceElement.textContent =
                `${comparison.title} · 비교에 필요한 전·후 일일 데이터가 아직 충분하지 않습니다.`;
        }

        if (compareDdiExplanationElement) {
            compareDdiExplanationElement.textContent =
                comparison.evaluationSummary ||
                "Challenge 전날과 수행일의 daily_metrics가 모두 저장되면 자동으로 비교됩니다.";
        }
        return;
    }

    const before = comparison.before;
    const after = comparison.after;
    const ddiChange = Number((after.ddi - before.ddi).toFixed(1));
    const nChange = after.appSwitchCount - before.appSwitchCount;
    const cChange = after.categorySwitchCount - before.categorySwitchCount;
    const rChange = after.repeatLoopCount - before.repeatLoopCount;

    if (compareDdiDifferenceElement) {
        const direction = ddiChange > 0 ? "증가" : ddiChange < 0 ? "감소" : "변화 없음";
        compareDdiDifferenceElement.textContent =
            `${comparison.title} · DDI ${Math.abs(ddiChange).toFixed(1)} km ${direction}`;
    }

    if (compareDdiExplanationElement) {
        const statusText = comparison.success === true
            ? "Challenge 목표 달성"
            : comparison.success === false
                ? "Challenge 목표 미달성"
                : "Challenge 평가 완료";

        compareDdiExplanationElement.textContent =
            `${statusText}. 앱 전환 ${nChange >= 0 ? "+" : ""}${nChange}회, ` +
            `카테고리 전환 ${cChange >= 0 ? "+" : ""}${cChange}회, ` +
            `반복 루프 ${rChange >= 0 ? "+" : ""}${rChange}회 변화했습니다.` +
            (comparison.evaluationSummary ? ` ${comparison.evaluationSummary}` : "");
    }

    console.log("Challenge 전·후 실제 비교:", comparison);
}


renderChallengeComparison();


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
            || "저장된 AI 분석 결과가 아직 없습니다. Android 앱에서 AI 분석을 실행하면 이곳에 실제 분석 결과가 표시됩니다.";

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
            || "Android 앱에서 일간 AI 분석을 실행하면 Challenge가 생성되고 이곳에 표시됩니다.";

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


    /*
        리포트 영역도 최신 실제 데이터로 갱신
    */

    renderAiReport();
    renderWeeklyReport();
    renderMonthlyReport();


    /*
        디지털 활동 도시가 이미 열려 있으면
        최신 앱/이동/루프 데이터로 다시 생성한다.
    */

    if (
        document.querySelector(
            "#digitalCitySection"
        )
    ) {
        renderDigitalCity(
            usageData
        );
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
   END OF ECHO PATH APP
========================================= */