/* =========================================
   Echo Path
   Statistics / Charts
========================================= */


/* =========================================
   0. Chart 객체 저장
========================================= */

let periodUsageChartInstance = null;
let appUsageChartInstance = null;
let activityBalanceChartInstance = null;
let weeklyDdiTrendChartInstance = null;
let monthlyDdiTrendChartInstance = null;


/* =========================================
   1. 분 → 시간 형식 변환

   예:
   270분 → 4h 30m
========================================= */

function formatMinutes(minutes) {

    const hours =
        Math.floor(
            minutes / 60
        );


    const remainingMinutes =
        Math.round(
            minutes % 60
        );


    if (hours === 0) {

        return `${remainingMinutes}m`;

    }


    return (
        `${hours}h `
        +
        `${String(
            remainingMinutes
        ).padStart(
            2,
            "0"
        )}m`
    );

}



/* =========================================
   2. 일간 / 주간 / 월간
   카테고리별 사용시간 그래프
========================================= */

function renderPeriodUsageChart(
    usageData,
    period = "daily"
) {

    const canvas =
        document.querySelector(
            "#periodUsageChart"
        );


    if (!canvas) {

        console.error(
            "periodUsageChart를 찾을 수 없습니다."
        );

        return;

    }


    const periodData =
        usageData
            .periodUsage
            ?.[period];


    if (!periodData) {

        console.error(
            `기간 데이터를 찾을 수 없습니다: ${period}`
        );

        return;

    }


    const categories =
        Object.keys(
            periodData.categories
        );


    const values =
        Object.values(
            periodData.categories
        );


    /* 전체 사용시간 */

    const totalMinutes =
        values.reduce(
            (
                sum,
                value
            ) =>
                sum + value,
            0
        );


    /* 기간 이름 */

    const periodLabelElement =
        document.querySelector(
            "#periodLabel"
        );


    if (periodLabelElement) {

        periodLabelElement.textContent =
            periodData.label;

    }


    /* 전체 사용시간 표시 */

    const totalElement =
        document.querySelector(
            "#periodTotalUsage"
        );


    if (totalElement) {

        totalElement.textContent =
            formatMinutes(
                totalMinutes
            );

    }


    /*
        이미 그래프가 만들어져 있으면
        새로 만들지 않고 데이터만 변경
    */

    if (periodUsageChartInstance) {

        periodUsageChartInstance
            .data
            .labels =
            categories;


        periodUsageChartInstance
            .data
            .datasets[0]
            .data =
            values;


        periodUsageChartInstance.update();

        return;

    }


    /* 처음 그래프 생성 */

    periodUsageChartInstance =
        new Chart(
            canvas,
            {

                type: "bar",


                data: {

                    labels:
                        categories,


                    datasets: [

                        {

                            label:
                                "사용 시간(분)",

                            data:
                                values,

                            borderWidth: 1,

                            borderRadius: 8

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {

                            display: false

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,


                            title: {

                                display: true,

                                text: "분"

                            }

                        }

                    }

                }

            }
        );

}



/* =========================================
   3. 일간 / 주간 / 월간 버튼 설정
========================================= */

function setupPeriodButtons(
    usageData
) {

    const buttons =
        document.querySelectorAll(
            ".period-button"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {


                    /* 모든 버튼 선택 해제 */

                    buttons.forEach(
                        (item) => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    /* 클릭한 버튼 활성화 */

                    button.classList.add(
                        "active"
                    );


                    const period =
                        button.dataset.period;


                    renderPeriodUsageChart(
                        usageData,
                        period
                    );

                }
            );

        }
    );

}



/* =========================================
   4. 앱별 사용시간 그래프
========================================= */

function renderAppUsageChart(
    usageData
) {

    const canvas =
        document.querySelector(
            "#appUsageChart"
        );


    if (!canvas) {

        console.error(
            "appUsageChart를 찾을 수 없습니다."
        );

        return;

    }


    const apps =
        usageData.apps
        ?? [];


    const labels =
        apps.map(
            (app) =>
                app.name
        );


    const values =
        apps.map(
            (app) =>
                app.usageMinutes
        );


    /* 기존 그래프 제거 */

    if (appUsageChartInstance) {

        appUsageChartInstance.destroy();

    }


    appUsageChartInstance =
        new Chart(
            canvas,
            {

                type: "bar",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                "사용 시간(분)",

                            data:
                                values,

                            borderWidth: 1,

                            borderRadius: 8

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {

                            display: false

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero: true,


                            title: {

                                display: true,

                                text: "분"

                            }

                        }

                    }

                }

            }
        );

}



/* =========================================
   5. 생산적 활동 / 오락 활동 계산
========================================= */

function calculateActivityBalance(
    usageData
) {

    let productiveMinutes = 0;
    let entertainmentMinutes = 0;


    const apps =
        usageData.apps
        ?? [];


    apps.forEach(
        (app) => {


            if (
                app.activityType
                ===
                "productive"
            ) {

                productiveMinutes +=
                    app.usageMinutes;

            }


            else if (
                app.activityType
                ===
                "entertainment"
            ) {

                entertainmentMinutes +=
                    app.usageMinutes;

            }

        }
    );


    return {

        productiveMinutes,

        entertainmentMinutes

    };

}



/* =========================================
   6. 생산적 활동 / 오락 활동 도넛그래프
========================================= */

function renderActivityBalanceChart(
    usageData
) {

    const canvas =
        document.querySelector(
            "#activityBalanceChart"
        );


    if (!canvas) {

        console.error(
            "activityBalanceChart를 찾을 수 없습니다."
        );

        return;

    }


    const balance =
        calculateActivityBalance(
            usageData
        );


    if (activityBalanceChartInstance) {

        activityBalanceChartInstance.destroy();

    }


    activityBalanceChartInstance =
        new Chart(
            canvas,
            {

                type: "doughnut",


                data: {

                    labels: [

                        "생산적 활동",

                        "오락 활동"

                    ],


                    datasets: [

                        {

                            data: [

                                balance
                                    .productiveMinutes,

                                balance
                                    .entertainmentMinutes

                            ],

                            borderWidth: 2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    cutout:
                        "65%",


                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );


    /* 생산적 활동 시간 표시 */

    const productiveElement =
        document.querySelector(
            "#productiveTime"
        );


    if (productiveElement) {

        productiveElement.textContent =
            formatMinutes(
                balance.productiveMinutes
            );

    }


    /* 오락 활동 시간 표시 */

    const entertainmentElement =
        document.querySelector(
            "#entertainmentTime"
        );


    if (entertainmentElement) {

        entertainmentElement.textContent =
            formatMinutes(
                balance.entertainmentMinutes
            );

    }

}




/* =========================================
   실제 앱 이름 표시 보정
   - packageName -> usageData.apps의 실제 앱 이름
   - 이미 앱 이름이면 그대로 사용
========================================= */
function resolveReadableAppName(
    usageData,
    value
) {
    const raw =
        String(
            value ?? ""
        ).trim();

    if (!raw) {
        return "";
    }

    const matchedApp =
        (usageData.apps ?? [])
            .find(
                (item) =>
                    item.packageName === raw
                    ||
                    item.name === raw
            );

    return matchedApp?.name || raw;
}


function formatReadableStatisticsRoute(
    usageData,
    route
) {
    const values =
        Array.isArray(route)
            ? route
            : String(route ?? "")
                .split(/\s*(?:→|->|>)\s*/);

    const readable =
        values
            .map(
                (value) =>
                    resolveReadableAppName(
                        usageData,
                        value
                    )
            )
            .filter(Boolean)
            .filter(
                (
                    value,
                    index,
                    array
                ) =>
                    index === 0
                    ||
                    value !== array[index - 1]
            );

    return readable.length > 0
        ? readable.join(" → ")
        : "-";
}


/* =========================================
   7. 앱 이동 타임라인
========================================= */

function renderTimeline(
    usageData
) {

    const timelineElement =
        document.querySelector(
            "#usageTimeline"
        );


    if (!timelineElement) {

        console.error(
            "usageTimeline을 찾을 수 없습니다."
        );

        return;

    }


    const timeline =
        usageData.timeline
        ?? [];


    timelineElement.innerHTML =
        "";


    if (
        timeline.length === 0
    ) {

        timelineElement.innerHTML = `

            <p class="empty-message">
                앱 이동 데이터가 없습니다.
            </p>

        `;

        return;

    }


    timeline.forEach(
        (
            item,
            index
        ) => {


            const timelineItem =
                document.createElement(
                    "div"
                );


            timelineItem.className =
                "timeline-item";


            timelineItem.innerHTML = `

                <div class="timeline-time">

                    ${item.time}

                </div>


                <div class="timeline-line">

                    <span class="timeline-dot"></span>

                </div>


                <div class="timeline-content">

                    <strong>
                        ${resolveReadableAppName(
                            usageData,
                            item.app
                        )}
                    </strong>

                    <span>
                        ${item.category}
                    </span>

                    <p>
                        ${formatMinutes(
                            item.durationMinutes
                        )}
                    </p>

                </div>

            `;


            timelineElement.appendChild(
                timelineItem
            );


            /*
                마지막 앱이 아니면
                아래쪽 화살표 표시
            */

            if (
                index
                <
                timeline.length - 1
            ) {

                const arrow =
                    document.createElement(
                        "div"
                    );


                arrow.className =
                    "timeline-arrow";


                arrow.textContent =
                    "↓";


                timelineElement.appendChild(
                    arrow
                );

            }

        }
    );

}



/* =========================================
   8. 주간 사용량 히트맵
========================================= */

function renderHeatmap(
    usageData
) {

    const container =
        document.querySelector(
            "#usageHeatmap"
        );


    if (!container) {

        console.error(
            "usageHeatmap을 찾을 수 없습니다."
        );

        return;

    }


    const heatmap =
        usageData.heatmap;


    if (!heatmap) {

        console.error(
            "사용 히트맵 데이터가 없습니다."
        );

        return;

    }


    container.innerHTML =
        "";


    /* 왼쪽 위 빈 칸 */

    const corner =
        document.createElement(
            "div"
        );


    corner.className =
        "heatmap-corner";


    container.appendChild(
        corner
    );


    /* =====================================
       시간 헤더
       0시 ~ 23시
    ===================================== */

    for (
        let hour = 0;
        hour < 24;
        hour++
    ) {

        const hourLabel =
            document.createElement(
                "div"
            );


        hourLabel.className =
            "heatmap-hour";


        /*
            화면 공간 때문에
            3시간 간격으로 숫자 표시
        */

        if (
            hour % 3 === 0
        ) {

            hourLabel.textContent =
                String(
                    hour
                ).padStart(
                    2,
                    "0"
                );

        }


        container.appendChild(
            hourLabel
        );

    }


    /* =====================================
       요일별 데이터
    ===================================== */

    heatmap.days.forEach(
        (
            day,
            dayIndex
        ) => {


            const dayLabel =
                document.createElement(
                    "div"
                );


            dayLabel.className =
                "heatmap-day";


            dayLabel.textContent =
                day;


            container.appendChild(
                dayLabel
            );


            const dayValues =
                heatmap.values[
                    dayIndex
                ]
                ?? [];


            dayValues.forEach(
                (
                    value,
                    hour
                ) => {


                    const cell =
                        document.createElement(
                            "div"
                        );


                    cell.className =
                        `heatmap-cell level-${value}`;


                    cell.title =
                        `${day}요일 ${hour}시 · 활성도 ${value}`;


                    container.appendChild(
                        cell
                    );

                }
            );

        }
    );

}



/* =========================================
   9. DDI 행동 복잡도 히트맵
========================================= */

function renderDdiHeatmap(
    usageData
) {

    const container =
        document.querySelector(
            "#ddiHeatmap"
        );


    if (!container) {

        console.error(
            "ddiHeatmap을 찾을 수 없습니다."
        );

        return;

    }


    const heatmap =
        usageData.ddiHeatmap;


    if (!heatmap) {

        console.error(
            "DDI 히트맵 데이터가 없습니다."
        );

        return;

    }


    container.innerHTML =
        "";


    /* 왼쪽 위 빈 칸 */

    const corner =
        document.createElement(
            "div"
        );


    corner.className =
        "heatmap-corner";


    container.appendChild(
        corner
    );


    /* =====================================
       시간 헤더
    ===================================== */

    for (
        let hour = 0;
        hour < 24;
        hour++
    ) {

        const hourLabel =
            document.createElement(
                "div"
            );


        hourLabel.className =
            "heatmap-hour";


        if (
            hour % 3 === 0
        ) {

            hourLabel.textContent =
                String(
                    hour
                ).padStart(
                    2,
                    "0"
                );

        }


        container.appendChild(
            hourLabel
        );

    }


    /* =====================================
       요일별 DDI 데이터
    ===================================== */

    heatmap.days.forEach(
        (
            day,
            dayIndex
        ) => {


            const dayLabel =
                document.createElement(
                    "div"
                );


            dayLabel.className =
                "heatmap-day";


            dayLabel.textContent =
                day;


            container.appendChild(
                dayLabel
            );


            const dayValues =
                heatmap.values[
                    dayIndex
                ]
                ?? [];


            dayValues.forEach(
                (
                    value,
                    hour
                ) => {


                    const cell =
                        document.createElement(
                            "div"
                        );


                    cell.className =
                        `heatmap-cell ddi-level-${value}`;


                    cell.title =
                        `${day}요일 ${hour}시 · DDI 복잡도 ${value}`;


                    container.appendChild(
                        cell
                    );

                }
            );

        }
    );

}



/* =========================================
   10. DDI 복잡 시간 TOP 3
========================================= */

function renderDdiTopTimes(
    usageData
) {

    const container =
        document.querySelector(
            "#ddiTopTimes"
        );


    if (!container) {

        console.error(
            "ddiTopTimes를 찾을 수 없습니다."
        );

        return;

    }


    const hourlyDetails =
        usageData.ddiHourlyDetails
        ?? [];


    if (
        hourlyDetails.length === 0
    ) {

        container.innerHTML = `

            <p class="empty-message">
                분석할 DDI 데이터가 없습니다.
            </p>

        `;

        return;

    }


    /*
        원본 데이터를 변경하지 않도록
        배열을 복사한 뒤 DDI 내림차순 정렬
    */

    const sortedDetails =
        [...hourlyDetails]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.ddi
                    -
                    a.ddi
            );


    /*
        상위 3개
    */

    const topThree =
        sortedDetails.slice(
            0,
            3
        );


    container.innerHTML =
        "";


    topThree.forEach(
        (
            item,
            index
        ) => {


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "ddi-time-card";


            /* 앱 이동 경로 */

            const routeText =
                formatReadableStatisticsRoute(
                    usageData,
                    item.route
                );


            /* 시작 시간 */

            const startTime =
                `${String(
                    item.startHour
                ).padStart(
                    2,
                    "0"
                )}:00`;


            /* 종료 시간 */

            const endTime =
                `${String(
                    item.endHour
                ).padStart(
                    2,
                    "0"
                )}:00`;


            card.innerHTML = `

                <div class="ddi-rank">

                    ${index + 1}

                </div>


                <div class="ddi-time-content">

                    <div class="ddi-time-header">

                        <strong>

                            ${startTime}~${endTime}

                        </strong>


                        <span class="ddi-time-score">

                            ${item.ddi.toFixed(1)} km

                        </span>

                    </div>


                    <div class="ddi-route">

                        ${routeText}

                    </div>


                    <div class="ddi-time-metrics">

                        <span>

                            앱 전환

                            <strong>
                                ${item.appSwitchCount}
                            </strong>

                        </span>


                        <span>

                            카테고리 전환

                            <strong>
                                ${item.categorySwitchCount}
                            </strong>

                        </span>


                        <span>

                            반복 루프

                            <strong>
                                ${item.repeatLoopCount}
                            </strong>

                        </span>

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}



/* =========================================
   11. 주간 DDI 추세 그래프

   weeklyReport.currentWeek.days 사용

   예:
   일 40.5
   월 44.2
   화 52.8
   수 38.6
   목 45.9
========================================= */

function renderWeeklyDdiTrendChart(
    usageData
) {

    const canvas =
        document.querySelector(
            "#weeklyDdiTrendChart"
        );


    const insightElement =
        document.querySelector(
            "#weeklyDdiTrendInsight"
        );


    /*
        index.html에 해당 canvas가 없으면
        오류 없이 종료
    */

    if (!canvas) {

        console.warn(
            "weeklyDdiTrendChart를 찾을 수 없습니다."
        );

        return;

    }


    const days =
        usageData
            .weeklyReport
            ?.currentWeek
            ?.days
        ?? [];


    /*
        데이터가 없는 경우
    */

    if (
        days.length === 0
    ) {

        if (insightElement) {

            insightElement.textContent =
                "주간 DDI 데이터가 아직 없습니다.";

        }


        return;

    }


    /* =====================================
       X축 요일
    ===================================== */

    const labels =
        days.map(
            (item) =>
                `${item.day}요일`
        );


    /* =====================================
       Y축 DDI
    ===================================== */

    const values =
        days.map(
            (item) =>
                item.ddi
        );


    /* =====================================
       가장 높은 DDI
    ===================================== */

    const highestDay =
        [...days]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.ddi
                    -
                    a.ddi
            )[0];


    /* =====================================
       가장 낮은 DDI
    ===================================== */

    const lowestDay =
        [...days]
            .sort(
                (
                    a,
                    b
                ) =>
                    a.ddi
                    -
                    b.ddi
            )[0];


    /*
        이미 그래프가 있으면 제거
    */

    if (
        weeklyDdiTrendChartInstance
    ) {

        weeklyDdiTrendChartInstance.destroy();

    }


    /* =====================================
       Chart.js 선 그래프
    ===================================== */

    weeklyDdiTrendChartInstance =
        new Chart(
            canvas,
            {

                type:
                    "line",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                "DDI (km)",

                            data:
                                values,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6,

                            tension:
                                0.35,

                            fill:
                                true

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return (
                                            `DDI ${Number(
                                                context.raw
                                            ).toFixed(
                                                1
                                            )} km`
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            }

                        },


                        y: {

                            /*
                                차이를 보기 쉽게
                                0부터 시작하지 않음
                            */

                            beginAtZero:
                                false,


                            title: {

                                display:
                                    true,

                                text:
                                    "DDI (km)"

                            },


                            ticks: {

                                callback:
                                    function(
                                        value
                                    ) {

                                        return (
                                            `${value} km`
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );


    /* =====================================
       그래프 자동 설명
    ===================================== */

    if (insightElement) {

        insightElement.textContent =
            `${highestDay.day}요일에 ${highestDay.ddi.toFixed(1)} km로 가장 높았고, ${lowestDay.day}요일에 ${lowestDay.ddi.toFixed(1)} km로 가장 낮았습니다.`;

    }

}

/* =========================================
   12. 월간 DDI 추세 그래프
========================================= */

function renderMonthlyDdiTrendChart(
    usageData
) {

    const canvas =
        document.querySelector(
            "#monthlyDdiTrendChart"
        );


    const insightElement =
        document.querySelector(
            "#monthlyDdiTrendInsight"
        );


    if (!canvas) {

        console.warn(
            "monthlyDdiTrendChart를 찾을 수 없습니다."
        );

        return;

    }


    const weeks =
        usageData
            .monthlyReport
            ?.currentMonth
            ?.weeks
        ?? [];


    if (weeks.length === 0) {

        if (insightElement) {

            insightElement.textContent =
                "월간 DDI 데이터가 아직 없습니다.";

        }

        return;

    }


    const labels =
        weeks.map(
            (item) =>
                item.week
        );


    const values =
        weeks.map(
            (item) =>
                item.averageDdi
        );


    const highestWeek =
        [...weeks]
            .sort(
                (a, b) =>
                    b.averageDdi
                    -
                    a.averageDdi
            )[0];


    const lowestWeek =
        [...weeks]
            .sort(
                (a, b) =>
                    a.averageDdi
                    -
                    b.averageDdi
            )[0];


    if (
        monthlyDdiTrendChartInstance
    ) {

        monthlyDdiTrendChartInstance.destroy();

    }


    monthlyDdiTrendChartInstance =
        new Chart(
            canvas,
            {

                type: "line",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                "평균 DDI (km)",

                            data:
                                values,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6,

                            tension:
                                0.35,

                            fill:
                                true

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return (
                                            `평균 DDI ${Number(
                                                context.raw
                                            ).toFixed(
                                                1
                                            )} km`
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            }

                        },


                        y: {

                            beginAtZero:
                                false,


                            title: {

                                display:
                                    true,

                                text:
                                    "DDI (km)"

                            },


                            ticks: {

                                callback:
                                    function(
                                        value
                                    ) {

                                        return `${value} km`;

                                    }

                            }

                        }

                    }

                }

            }
        );


    if (insightElement) {

        insightElement.textContent =
            `${highestWeek.week}에 ${highestWeek.averageDdi.toFixed(1)} km로 가장 높았고, ${lowestWeek.week}에 ${lowestWeek.averageDdi.toFixed(1)} km로 가장 낮았습니다.`;

    }

}

/* =========================================
   12. 통계 / 그래프 전체 실행

   app.js에서

   renderStatistics(mockUsageData);

   형태로 실행
========================================= */

export function renderStatistics(
    usageData
) {


    /* =====================================
       카테고리 사용시간
       기본값 = 일간
    ===================================== */

    renderPeriodUsageChart(
        usageData,
        "daily"
    );


    /* 기간 선택 버튼 */

    setupPeriodButtons(
        usageData
    );


    /* 앱별 사용시간 */

    renderAppUsageChart(
        usageData
    );


    /* 생산 / 오락 */

    renderActivityBalanceChart(
        usageData
    );


    /* 일반 사용시간 히트맵 */

    renderHeatmap(
        usageData
    );


    /* DDI 히트맵 */

    renderDdiHeatmap(
        usageData
    );


    /* DDI 복잡 시간 TOP 3 */

    renderDdiTopTimes(
        usageData
    );


    /* 앱 이동 타임라인 */

    renderTimeline(
        usageData
    );


    /* 주간 DDI 추세 */

renderWeeklyDdiTrendChart(
    usageData
);


/* 월간 DDI 추세 */

renderMonthlyDdiTrendChart(
    usageData
);


console.log(
    "Echo Path 통계 화면 생성 완료"
);

}