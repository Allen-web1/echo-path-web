/* =========================================
   Echo Path
   Supabase Real Data Loader
========================================= */

import {
    supabase
}
from "./supabase.js";


import {
    getCurrentUser
}
from "./auth.js";


/* =========================================
   날짜 처리
========================================= */

function formatLocalDate(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}


function getDateDaysAgo(
    days
) {

    const date =
        new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    date.setDate(
        date.getDate() - days
    );

    return formatLocalDate(
        date
    );
}


/* =========================================
   앱 활동 유형
========================================= */

function getActivityType(
    category
) {

    const productiveCategories = [
        "AI·정보",
        "학습",
        "정보·검색",
        "생산성",
        "소통",
        "지도·이동",
        "생활·도구"
    ];


    const entertainmentCategories = [
        "SNS",
        "미디어",
        "쇼핑",
        "게임"
    ];


    if (
        productiveCategories.includes(
            category
        )
    ) {

        return "productive";

    }


    if (
        entertainmentCategories.includes(
            category
        )
    ) {

        return "entertainment";

    }


    return "neutral";
}


/* =========================================
   사용자 앱 카테고리 재분류
   Supabase Auth user_metadata에 저장된 값을
   웹 표시/통계용 카테고리에만 적용합니다.
========================================= */

function getCategoryOverrides(
    user
) {

    const value =
        user?.user_metadata
            ?.app_category_overrides;


    if (
        !value
        ||
        typeof value !== "object"
        ||
        Array.isArray(value)
    ) {

        return {};

    }


    return value;
}


function resolveUserCategory(
    packageName,
    originalCategory,
    overrides
) {

    const key =
        String(
            packageName
            ?? ""
        ).trim();


    const override =
        key
            ? String(
                overrides?.[key]
                ?? ""
            ).trim()
            : "";


    return (
        override
        ||
        originalCategory
        ||
        "기타"
    );
}


function applyCategoryOverridesToAppRows(
    rows,
    overrides
) {

    return (
        rows
        ?? []
    ).map(
        (item) => ({

            ...item,

            category:
                resolveUserCategory(
                    item.package_name,
                    item.category,
                    overrides
                )

        })
    );
}


function applyCategoryOverridesToTransitionRows(
    rows,
    overrides
) {

    return (
        rows
        ?? []
    ).map(
        (item) => ({

            ...item,

            from_category:
                resolveUserCategory(
                    item.from_package,
                    item.from_category,
                    overrides
                ),

            to_category:
                resolveUserCategory(
                    item.to_package,
                    item.to_category,
                    overrides
                )

        })
    );
}


/* =========================================
   ms → 분
========================================= */

function msToMinutes(
    milliseconds
) {

    return Number(
        (
            Number(
                milliseconds ?? 0
            )
            / 60000
        ).toFixed(
            2
        )
    );
}


/* =========================================
   앱별 실행 횟수 계산
========================================= */

function calculateLaunches(
    appRow,
    transitions
) {

    const incomingCount =
        transitions
            .filter(
                (item) =>
                    item.to_package
                    ===
                    appRow.package_name
            )
            .reduce(
                (
                    sum,
                    item
                ) =>
                    sum
                    +
                    Number(
                        item.transition_count
                        ?? 0
                    ),
                0
            );


    if (
        Number(
            appRow.usage_ms ?? 0
        ) > 0
        &&
        incomingCount === 0
    ) {

        return 1;

    }


    return incomingCount;
}


/* =========================================
   반복 루프 경로 처리
========================================= */

function parseLoopPath(
    item
) {

    const rawPath =
        String(
            item.path
            ?? ""
        ).trim();


    if (rawPath) {

        const route =
            rawPath
                .split(
                    /\s*(?:→|->|>|,)\s*/
                )
                .map(
                    (value) =>
                        value.trim()
                )
                .filter(
                    Boolean
                );


        if (route.length > 0) {

            return route;

        }

    }


    if (item.start_app) {

        return [
            item.start_app
        ];

    }


    return [];
}


/* =========================================
   카테고리 합산
========================================= */

function aggregateCategoryUsage(
    rows
) {

    const result = {};


    rows.forEach(
        (item) => {

            const category =
                item.category
                || "기타";


            if (!result[category]) {

                result[category] = 0;

            }


            result[category] +=
                msToMinutes(
                    item.usage_ms
                );

        }
    );


    Object.keys(
        result
    ).forEach(
        (key) => {

            result[key] =
                Number(
                    result[key].toFixed(
                        2
                    )
                );

        }
    );


    return result;
}


/* =========================================
   주간 DDI 데이터 생성
========================================= */

function buildWeeklyReport(
    metricRows
) {

    const dayLabels = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];


    const days = [];


    for (
        let offset = 6;
        offset >= 0;
        offset--
    ) {

        const date =
            new Date();

        date.setHours(
            0,
            0,
            0,
            0
        );

        date.setDate(
            date.getDate()
            -
            offset
        );


        const dateString =
            formatLocalDate(
                date
            );


        const metric =
            metricRows.find(
                (item) =>
                    item.record_date
                    ===
                    dateString
            );


        days.push({

            date:
                dateString,

            day:
                dayLabels[
                    date.getDay()
                ],

            ddi:
                Number(
                    metric?.ddi
                    ?? 0
                ),

            usageMinutes:
                msToMinutes(
                    metric?.total_usage_ms
                ),

            appSwitchCount:
                Number(
                    metric?.n_switches
                    ?? 0
                ),

            categorySwitchCount:
                Number(
                    metric?.c_category_switches
                    ?? 0
                ),

            repeatLoopCount:
                Number(
                    metric?.r_repeat_loops
                    ?? 0
                )

        });

    }


    return {

        currentWeek: {

            days

        }

    };
}


/* =========================================
   월간 DDI 데이터 생성
========================================= */

function buildMonthlyReport(
    metricRows
) {

    const now =
        new Date();


    const currentMonth =
        now.getMonth();


    const currentYear =
        now.getFullYear();


    const currentMonthRows =
        metricRows.filter(
            (item) => {

                const date =
                    new Date(
                        `${item.record_date}T00:00:00`
                    );


                return (
                    date.getFullYear()
                    ===
                    currentYear
                    &&
                    date.getMonth()
                    ===
                    currentMonth
                );

            }
        );


    const groupedWeeks = {};


    currentMonthRows.forEach(
        (item) => {

            const day =
                Number(
                    item.record_date
                        .split(
                            "-"
                        )[2]
                );


            const weekNumber =
                Math.ceil(
                    day / 7
                );


            const weekKey =
                `${weekNumber}주차`;


            if (
                !groupedWeeks[
                    weekKey
                ]
            ) {

                groupedWeeks[
                    weekKey
                ] = [];

            }


            groupedWeeks[
                weekKey
            ].push(
                item
            );

        }
    );


    const weeks =
        Object.entries(
            groupedWeeks
        ).map(
            (
                [
                    week,
                    rows
                ]
            ) => {

                const averageDdi =
                    rows.length > 0
                        ?
                        rows.reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum
                                +
                                Number(
                                    item.ddi
                                    ?? 0
                                ),
                            0
                        )
                        /
                        rows.length
                        :
                        0;


                const averageUsageMinutes =
                    rows.length > 0
                        ?
                        rows.reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum
                                +
                                msToMinutes(
                                    item.total_usage_ms
                                ),
                            0
                        )
                        /
                        rows.length
                        :
                        0;


                return {

                    week,

                    averageDdi:
                        Number(
                            averageDdi.toFixed(
                                1
                            )
                        ),

                    averageUsageMinutes:
                        Number(
                            averageUsageMinutes.toFixed(
                                1
                            )
                        )

                };

            }
        );


    return {

        currentMonth: {

            label:
                `${currentYear}년 ${currentMonth + 1}월`,

            weeks

        }

    };
}


/* =========================================
   시간대별 실제 데이터 변환
========================================= */

function createEmptyHourMatrix() {
    return Array.from(
        { length: 7 },
        () => Array(24).fill(0)
    );
}

function getHeatmapLevel(value, thresholds) {
    const number = Number(value ?? 0);

    if (number <= 0) return 0;
    if (number <= thresholds[0]) return 1;
    if (number <= thresholds[1]) return 2;
    if (number <= thresholds[2]) return 3;
    return 4;
}

function buildHourlyHeatmaps(hourlyRows) {
    const usageValues = createEmptyHourMatrix();
    const usageRawValues = createEmptyHourMatrix();
    const ddiValues = createEmptyHourMatrix();
    const ddiRawValues = createEmptyHourMatrix();

    const positiveDdiValues = hourlyRows
        .map((item) => Number(item.ddi ?? 0))
        .filter((value) => value > 0)
        .sort((a, b) => a - b);

    const maxDdi = positiveDdiValues.length > 0
        ? positiveDdiValues[positiveDdiValues.length - 1]
        : 0;

    const ddiThresholds = maxDdi > 0
        ? [maxDdi * 0.25, maxDdi * 0.50, maxDdi * 0.75]
        : [1, 2, 3];

    hourlyRows.forEach((item) => {
        const date = new Date(`${item.record_date}T00:00:00`);
        const dayIndex = date.getDay();
        const hour = Number(item.hour ?? -1);

        if (hour < 0 || hour > 23) return;

        const usageMinutes = msToMinutes(item.total_usage_ms);
        const ddi = Number(item.ddi ?? 0);

        usageRawValues[dayIndex][hour] = usageMinutes;
        usageValues[dayIndex][hour] = getHeatmapLevel(
            usageMinutes,
            [5, 15, 30]
        );

        ddiRawValues[dayIndex][hour] = Number(ddi.toFixed(2));
        ddiValues[dayIndex][hour] = getHeatmapLevel(
            ddi,
            ddiThresholds
        );
    });

    const days = [
        "일", "월", "화", "수", "목", "금", "토"
    ];

    return {
        heatmap: {
            days,
            values: usageValues,
            rawValues: usageRawValues
        },
        ddiHeatmap: {
            days,
            values: ddiValues,
            rawValues: ddiRawValues
        }
    };
}

function parseHourlyRouteEntries(routeText) {
    const text = String(routeText ?? "").trim();

    if (!text) return [];

    return text
        .split(/\s*(?:→|->|>)\s*/)
        .map((value) => {
            const raw = String(value ?? "").trim();

            if (!raw) return null;

            /*
                v1.0.3 Android 형식:
                packageName@@startTimestamp@@durationMs

                예전 데이터(앱 이름만 저장된 route)도 그대로 읽는다.
            */
            const parts = raw.split("@@");

            if (parts.length >= 3) {
                const durationMs = Number(parts.pop());
                const startTimestamp = Number(parts.pop());
                const app = parts.join("@@").trim();

                if (app) {
                    return {
                        app,
                        startTimestamp:
                            Number.isFinite(startTimestamp)
                                ? startTimestamp
                                : null,
                        durationMs:
                            Number.isFinite(durationMs)
                                ? durationMs
                                : null
                    };
                }
            }

            return {
                app: raw,
                startTimestamp: null,
                durationMs: null
            };
        })
        .filter(Boolean);
}

function parseHourlyRoute(routeText) {
    return parseHourlyRouteEntries(routeText)
        .map((entry) => entry.app)
        .filter(Boolean);
}

function formatTimelineClock(timestamp, fallbackHour) {
    const value = Number(timestamp);

    if (!Number.isFinite(value) || value <= 0) {
        return `${String(fallbackHour).padStart(2, "0")}:00`;
    }

    const date = new Date(value);

    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function buildAppNameLookup(appRows) {
    const lookup = new Map();

    (appRows ?? []).forEach((item) => {
        const packageName = String(item.package_name ?? "").trim();
        const appName = String(item.app_name ?? "").trim();

        if (packageName && appName) {
            lookup.set(packageName, appName);
        }
    });

    return lookup;
}

function resolveRouteAppName(value, appNameLookup) {
    const raw = String(value ?? "").trim();

    if (!raw) return "";

    return appNameLookup.get(raw) || raw;
}

function buildDdiHourlyDetails(hourlyRows, hourlyAppRows, dailyAppRows, today) {
    const appNameLookup = buildAppNameLookup([
        ...(dailyAppRows ?? []),
        ...(hourlyAppRows ?? [])
    ]);

    return hourlyRows
        .filter((item) => item.record_date === today)
        .filter((item) => Number(item.ddi ?? 0) > 0)
        .map((item) => {
            const hour = Number(item.hour ?? 0);
            const route = parseHourlyRoute(item.route)
                .map((value) => resolveRouteAppName(value, appNameLookup))
                .filter(Boolean);

            return {
                date: item.record_date,
                startHour: hour,
                endHour: Math.min(hour + 1, 24),
                ddi: Number(item.ddi ?? 0),
                appSwitchCount: Number(item.n_switches ?? 0),
                categorySwitchCount: Number(item.c_category_switches ?? 0),
                repeatLoopCount: Number(item.r_repeat_loops ?? 0),
                route
            };
        });
}

function buildHourlyTimeline(hourlyRows, hourlyAppRows, dailyAppRows, today) {
    const todayMetrics = hourlyRows
        .filter((item) => item.record_date === today)
        .sort((a, b) => Number(a.hour) - Number(b.hour));

    const todayApps = hourlyAppRows
        .filter((item) => item.record_date === today);

    const appNameLookup = buildAppNameLookup([
        ...(dailyAppRows ?? []),
        ...(hourlyAppRows ?? [])
    ]);

    const appLookup = new Map();

    /*
        hourly_app_usage와 daily_app_usage에 실제로 존재하는 앱만
        타임라인 후보로 인정한다.

        UsageEvents에는 키보드, 설정 패널, 시스템 서비스 등도
        ACTIVITY_RESUMED 이벤트로 섞일 수 있다. 이 값들을 그대로
        route에 그리면 com.samsung..., com.android... 같은 패키지명이
        수십 개 노출될 수 있으므로 실제 사용량 행과 매칭되지 않는
        항목은 화면 타임라인에서 제외한다.
    */
    todayApps.forEach((item) => {
        const hour = Number(item.hour);
        const appName = item.app_name || item.package_name;

        appLookup.set(`${hour}|||${appName}`, item);
        appLookup.set(`${hour}|||${item.package_name}`, item);
    });

    const dailyLookup = new Map();

    (dailyAppRows ?? [])
        .filter((item) => item.record_date === today)
        .forEach((item) => {
            if (item.package_name) {
                dailyLookup.set(item.package_name, item);
            }
            if (item.app_name) {
                dailyLookup.set(item.app_name, item);
            }
        });

    const rawTimeline = [];

    todayMetrics.forEach((metric) => {
        const hour = Number(metric.hour ?? 0);

        let routeEntries =
            parseHourlyRouteEntries(metric.route);

        /*
            구버전 데이터에는 세션 시간이 없을 수 있으므로
            해당 시간대에서 가장 오래 사용한 앱을 기존 방식으로 보완한다.
        */
        if (routeEntries.length === 0) {
            routeEntries = todayApps
                .filter((item) => Number(item.hour) === hour)
                .sort(
                    (a, b) =>
                        Number(b.usage_ms ?? 0) - Number(a.usage_ms ?? 0)
                )
                .slice(0, 1)
                .map((item) => ({
                    app: item.package_name || item.app_name,
                    startTimestamp: null,
                    durationMs: Number(item.usage_ms ?? 0)
                }));
        }

        routeEntries.forEach((entry) => {
            const rawApp = String(entry.app ?? "").trim();
            if (!rawApp) return;

            const appName =
                resolveRouteAppName(
                    rawApp,
                    appNameLookup
                );

            const appRow =
                appLookup.get(`${hour}|||${rawApp}`)
                ?? appLookup.get(`${hour}|||${appName}`)
                ?? todayApps.find(
                    (item) =>
                        Number(item.hour) === hour
                        && (
                            item.package_name === rawApp
                            || item.app_name === appName
                            || resolveRouteAppName(item.package_name, appNameLookup) === appName
                        )
                )
                ?? dailyLookup.get(rawApp)
                ?? dailyLookup.get(appName)
                ?? null;

            /*
                실제 앱 사용량 표에 없는 패키지는 시스템 이벤트일 가능성이 높다.
                타임라인 시각화에서는 제외한다.
            */
            if (!appRow) return;

            const exactDurationMs = Number(entry.durationMs);
            const hasExactDuration =
                Number.isFinite(exactDurationMs)
                && exactDurationMs > 0;

            const durationMs =
                hasExactDuration
                    ? exactDurationMs
                    : Number(appRow?.usage_ms ?? 0);

            if (!Number.isFinite(durationMs) || durationMs <= 0) return;

            const startTimestamp = Number(entry.startTimestamp);
            const hasStartTimestamp =
                Number.isFinite(startTimestamp)
                && startTimestamp > 0;

            rawTimeline.push({
                time: formatTimelineClock(
                    hasStartTimestamp ? startTimestamp : null,
                    hour
                ),
                app: appRow?.app_name || appName,
                packageName: appRow?.package_name || rawApp,
                category: appRow?.category || "기타",
                durationMinutes: msToMinutes(durationMs),
                startTimestamp:
                    hasStartTimestamp
                        ? startTimestamp
                        : null,
                durationMs,
                hasExactDuration
            });
        });
    });

    /*
        같은 실제 앱이 시스템 오버레이 때문에 여러 조각으로 끊긴 경우
        2분 이내의 연속 세션은 하나로 합친다.

        예: 네이버 8분 → 시스템 패널 3초 → 네이버 12분
        화면에는 네이버 약 20분으로 표시한다.
    */
    const mergedTimeline = [];

    rawTimeline.forEach((item) => {
        const previous = mergedTimeline[mergedTimeline.length - 1];

        const sameApp =
            previous
            && previous.packageName === item.packageName;

        const previousEnd =
            previous?.startTimestamp != null
                ? previous.startTimestamp + previous.durationMs
                : null;

        const gapMs =
            previousEnd != null
            && item.startTimestamp != null
                ? item.startTimestamp - previousEnd
                : null;

        const closeEnough =
            gapMs != null
            && gapMs >= 0
            && gapMs <= 120000;

        if (
            sameApp
            && previous.hasExactDuration
            && item.hasExactDuration
            && closeEnough
        ) {
            previous.durationMs += item.durationMs;
            previous.durationMinutes = msToMinutes(previous.durationMs);
            return;
        }

        mergedTimeline.push({ ...item });
    });

    return mergedTimeline.map((item) => ({
        time: item.time,
        app: item.app,
        category: item.category,
        durationMinutes: item.durationMinutes
    }));
}

/* =========================================
   Challenge 전·후 실제 비교 데이터
========================================= */

function getPreviousDateString(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return formatLocalDate(date);
}


function metricRowToChallengeSnapshot(metric) {
    if (!metric) return null;

    return {
        date: metric.record_date,
        totalUsageHours: Number(metric.t_hours ?? 0),
        appSwitchCount: Number(metric.n_switches ?? 0),
        categorySwitchCount: Number(metric.c_category_switches ?? 0),
        repeatLoopCount: Number(metric.r_repeat_loops ?? 0),
        ddi: Number(metric.ddi ?? 0)
    };
}



function buildDailyBehaviorComparison(
    metricRows,
    today
) {

    const todayDate =
        String(
            today
            ?? ""
        )
            .trim();


    if (
        !todayDate
    ) {

        return null;

    }


    const yesterdayDate =
        getPreviousDateString(
            todayDate
        );


    const yesterdayMetric =
        (
            metricRows
            ?? []
        )
            .find(
                (item) =>
                    item.record_date
                    ===
                    yesterdayDate
            )
        ?? null;


    const todayMetric =
        (
            metricRows
            ?? []
        )
            .find(
                (item) =>
                    item.record_date
                    ===
                    todayDate
            )
        ?? null;


    const before =
        metricRowToChallengeSnapshot(
            yesterdayMetric
        );


    const after =
        metricRowToChallengeSnapshot(
            todayMetric
        );


    return {

        beforeDate:
            yesterdayDate,

        afterDate:
            todayDate,

        before,

        after,

        hasYesterday:
            Boolean(
                before
            ),

        hasToday:
            Boolean(
                after
            ),

        hasFullComparison:
            Boolean(
                before
                &&
                after
            ),

        todayIsPartial:
            true

    };

}


function buildChallengeComparison(challengeRows, evaluationRows, metricRows) {
    if (!Array.isArray(challengeRows) || challengeRows.length === 0) {
        return null;
    }

    const evaluatedChallenges = challengeRows
        .filter((item) => item.status === "completed" || item.status === "failed")
        .sort((a, b) => String(b.challenge_date ?? "").localeCompare(String(a.challenge_date ?? "")));

    const challenge = evaluatedChallenges[0] ?? null;

    if (!challenge?.challenge_date) {
        return null;
    }

    const evaluation = Array.isArray(evaluationRows)
        ? evaluationRows.find((item) => Number(item.challenge_id) === Number(challenge.id)) ?? null
        : null;

    const afterDate = challenge.challenge_date;
    const beforeDate = getPreviousDateString(afterDate);

    const beforeMetric = metricRows.find((item) => item.record_date === beforeDate) ?? null;
    const afterMetric = metricRows.find((item) => item.record_date === afterDate) ?? null;

    const before = metricRowToChallengeSnapshot(beforeMetric);
    const after = metricRowToChallengeSnapshot(afterMetric);

    return {
        challengeId: challenge.id,
        title: challenge.title ?? "Challenge",
        description: challenge.description ?? "",
        targetMetric: challenge.target_metric ?? "",
        targetValue: challenge.target_value == null ? null : Number(challenge.target_value),
        baselineValue: challenge.baseline_value == null ? null : Number(challenge.baseline_value),
        resultValue: challenge.result_value == null ? null : Number(challenge.result_value),
        status: challenge.status ?? "",
        challengeDate: afterDate,
        beforeDate,
        before,
        after,
        success: evaluation?.success ?? (challenge.status === "completed"),
        evaluationSummary: evaluation?.evaluation_summary ?? "",
        nextRecommendation: evaluation?.next_recommendation ?? "",
        hasFullComparison: Boolean(before && after)
    };
}


/* =========================================
   실제 Echo Path 데이터 불러오기
========================================= */


function buildSelfAwarenessComparison(
    assessmentRows,
    metricRows,
    appRows,
    today
) {
    const assessment =
        (assessmentRows ?? [])
            .filter(
                (item) =>
                    item?.assessment_type === "pre"
            )
            .sort(
                (a, b) => {
                    const aKey =
                        String(
                            a?.created_at
                            ?? a?.id
                            ?? ""
                        );

                    const bKey =
                        String(
                            b?.created_at
                            ?? b?.id
                            ?? ""
                        );

                    return bKey.localeCompare(aKey);
                }
            )[0]
        ?? null;

    if (!assessment) {
        return {
            hasAssessment: false,
            daily: null,
            weekly: null,
            monthly: null
        };
    }

    const buildPeriod =
        (
            days,
            label
        ) => {

            const cutoffDate =
                getDateDaysAgo(
                    days - 1
                );

            const metrics =
                (metricRows ?? [])
                    .filter(
                        (item) =>
                            item.record_date >= cutoffDate
                            &&
                            item.record_date <= today
                    )
                    .sort(
                        (a, b) =>
                            String(b.record_date)
                                .localeCompare(
                                    String(a.record_date)
                                )
                    )
                    .slice(
                        0,
                        days
                    );

            if (metrics.length === 0) {
                return null;
            }

            const measuredDates =
                new Set(
                    metrics.map(
                        (item) =>
                            item.record_date
                    )
                );

            const apps =
                (appRows ?? [])
                    .filter(
                        (item) =>
                            measuredDates.has(
                                item.record_date
                            )
                    );

            const average =
                (values) => {
                    const numeric =
                        values
                            .map(Number)
                            .filter(Number.isFinite);

                    return numeric.length
                        ? numeric.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) / numeric.length
                        : 0;
                };

            const actualDailyMinutes =
                Math.round(
                    average(
                        metrics.map(
                            (item) =>
                                Number(
                                    item.total_usage_ms
                                    ?? 0
                                )
                        )
                    ) / 60_000
                );

            const actualSwitchCount =
                Math.round(
                    average(
                        metrics.map(
                            (item) =>
                                Number(
                                    item.n_switches
                                    ?? 0
                                )
                        )
                    )
                );

            const actualRepeatLoops =
                Math.round(
                    average(
                        metrics.map(
                            (item) =>
                                Number(
                                    item.r_repeat_loops
                                    ?? 0
                                )
                        )
                    )
                );

            const ddi =
                average(
                    metrics.map(
                        (item) =>
                            Number(
                                item.ddi
                                ?? 0
                            )
                    )
                );

            const totalCategorizedUsageMs =
                apps.reduce(
                    (sum, item) =>
                        sum
                        +
                        Number(
                            item.usage_ms
                            ?? 0
                        ),
                    0
                );

            const learningMs =
                apps
                    .filter(
                        (item) =>
                            item.category === "학습"
                    )
                    .reduce(
                        (sum, item) =>
                            sum
                            +
                            Number(
                                item.usage_ms
                                ?? 0
                            ),
                        0
                    );

            const entertainmentCategories =
                new Set([
                    "SNS",
                    "미디어",
                    "게임"
                ]);

            const entertainmentMs =
                apps
                    .filter(
                        (item) =>
                            entertainmentCategories.has(
                                item.category
                            )
                    )
                    .reduce(
                        (sum, item) =>
                            sum
                            +
                            Number(
                                item.usage_ms
                                ?? 0
                            ),
                        0
                    );

            return {
                label,
                measurementDays:
                    metrics.length,

                estimatedDailyMinutes:
                    Number(
                        assessment.estimated_daily_minutes
                        ?? 0
                    ),

                actualDailyMinutes,

                switchingSelfScore:
                    Number(
                        assessment.switching_frequency
                        ?? 0
                    ),

                actualSwitchCount,

                habitualCheckingSelfScore:
                    Number(
                        assessment.habitual_checking
                        ?? 0
                    ),

                actualRepeatLoops,

                perceivedLearningRatio:
                    Number(
                        assessment.learning_use_ratio
                        ?? 0
                    ),

                actualLearningRatio:
                    totalCategorizedUsageMs > 0
                        ? Math.round(
                            learningMs
                            /
                            totalCategorizedUsageMs
                            *
                            100
                        )
                        : null,

                perceivedEntertainmentRatio:
                    Number(
                        assessment.entertainment_use_ratio
                        ?? 0
                    ),

                actualEntertainmentRatio:
                    totalCategorizedUsageMs > 0
                        ? Math.round(
                            entertainmentMs
                            /
                            totalCategorizedUsageMs
                            *
                            100
                        )
                        : null,

                ddi:
                    Number(
                        ddi.toFixed(2)
                    )
            };
        };

    return {
        hasAssessment: true,
        assessmentCreatedAt:
            assessment.created_at
            ?? null,
        daily:
            buildPeriod(
                1,
                "일간"
            ),
        weekly:
            buildPeriod(
                7,
                "주간"
            ),
        monthly:
            buildPeriod(
                30,
                "월간"
            )
    };
}



/* =========================================
   저장된 AI 부가 결과 복원
========================================= */

function parseStoredAiEnvelope(
    value
) {

    if (
        value
        &&
        typeof value === "object"
        &&
        !Array.isArray(
            value
        )
    ) {

        return value;

    }


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


        return (
            parsed
            &&
            typeof parsed === "object"
            &&
            !Array.isArray(
                parsed
            )
        )
            ? parsed
            : null;

    }

    catch (
        error
    ) {

        return null;

    }

}


export async function loadEchoPathUsageData() {

    const user =
        await getCurrentUser();


    if (!user) {

        throw new Error(
            "로그인된 사용자가 없습니다."
        );

    }

    console.log("현재 웹 로그인 User ID:", user.id, "Email:", user.email);

    const today =
        getDateDaysAgo(
            0
        );


    const sevenDaysAgo =
        getDateDaysAgo(
            6
        );


    const thirtyDaysAgo =
        getDateDaysAgo(
            29
        );


    /* =====================================
       실제 Supabase 데이터 조회
    ===================================== */

    const [
        metricsResult,
        appsResult,
        transitionsResult,
        loopsResult,
        hourlyMetricsResult,
        hourlyAppsResult
    ] =
        await Promise.all([


            supabase
                .from(
                    "daily_metrics"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .gte(
                    "record_date",
                    thirtyDaysAgo
                )
                .lte(
                    "record_date",
                    today
                )
                .order(
                    "record_date",
                    {
                        ascending: true
                    }
                ),


            supabase
                .from(
                    "daily_app_usage"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .gte(
                    "record_date",
                    thirtyDaysAgo
                )
                .lte(
                    "record_date",
                    today
                ),


            supabase
                .from(
                    "daily_transitions"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .eq(
                    "record_date",
                    today
                )
                .order(
                    "transition_count",
                    {
                        ascending: false
                    }
                ),


            supabase
                .from(
                    "daily_repeat_loops"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .eq(
                    "record_date",
                    today
                )
                .order(
                    "loop_count",
                    {
                        ascending: false
                    }
                ),


            supabase
                .from(
                    "hourly_metrics"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .gte(
                    "record_date",
                    sevenDaysAgo
                )
                .lte(
                    "record_date",
                    today
                )
                .order(
                    "record_date",
                    {
                        ascending: true
                    }
                )
                .order(
                    "hour",
                    {
                        ascending: true
                    }
                ),


            supabase
                .from(
                    "hourly_app_usage"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .eq(
                    "record_date",
                    today
                )
                .order(
                    "hour",
                    {
                        ascending: true
                    }
                )

        ]);


    /* =====================================
       오류 확인
    ===================================== */

    if (metricsResult.error) {

        throw metricsResult.error;

    }


    if (appsResult.error) {

        throw appsResult.error;

    }


    if (transitionsResult.error) {

        throw transitionsResult.error;

    }


    if (loopsResult.error) {

        throw loopsResult.error;

    }


    /*
        hourly_* 테이블은 새 기능입니다.
        SQL 적용 전에도 기존 일일 화면이 깨지지 않도록
        시간대 테이블 오류는 경고만 남기고 빈 데이터로 처리합니다.
    */

    if (hourlyMetricsResult.error) {
        console.warn(
            "hourly_metrics 조회 대기:",
            hourlyMetricsResult.error.message
            ?? hourlyMetricsResult.error
        );
    }

    if (hourlyAppsResult.error) {
        console.warn(
            "hourly_app_usage 조회 대기:",
            hourlyAppsResult.error.message
            ?? hourlyAppsResult.error
        );
    }


    const metricRows =
        metricsResult.data
        ?? [];


    /*
        사용자가 설정 화면에서 바꾼 앱 분류는
        Supabase Auth user_metadata에 계정별로 저장합니다.

        원본 daily/hourly 테이블의 category 값은 수정하지 않고,
        웹에서 데이터를 구성하는 시점에만 덮어씁니다.
    */

    const categoryOverrides =
        getCategoryOverrides(
            user
        );


    const rawAppRows =
        appsResult.data
        ?? [];


    const appRows =
        applyCategoryOverridesToAppRows(
            rawAppRows,
            categoryOverrides
        );


    const rawTransitions =
        transitionsResult.data
        ?? [];


    const transitions =
        applyCategoryOverridesToTransitionRows(
            rawTransitions,
            categoryOverrides
        );


    const loopRows =
        loopsResult.data
        ?? [];


    const hourlyMetricRows =
        hourlyMetricsResult.error
            ? []
            : (hourlyMetricsResult.data ?? []);


    const rawHourlyAppRows =
        hourlyAppsResult.error
            ? []
            : (hourlyAppsResult.data ?? []);


    const hourlyAppRows =
        applyCategoryOverridesToAppRows(
            rawHourlyAppRows,
            categoryOverrides
        );


    const hourlyVisualization =
        buildHourlyHeatmaps(
            hourlyMetricRows
        );


    const hourlyTimeline =
        buildHourlyTimeline(
            hourlyMetricRows,
            hourlyAppRows,
            appRows,
            today
        );


    const hourlyDdiDetails =
        buildDdiHourlyDetails(
            hourlyMetricRows,
            hourlyAppRows,
            appRows,
            today
        );


    /* =====================================
       Challenge 실제 전·후 비교 데이터 조회
       기존 daily/hourly 조회와 분리하여 실패 시 기존 화면에 영향 없음
    ===================================== */

    let challengeRows = [];
    let challengeEvaluationRows = [];
    let aiAnalysisRows = [];
    let selfAssessmentRows = [];

    try {
        const [
            challengeResult,
            evaluationResult,
            aiAnalysisResult,
            selfAssessmentResult
        ] = await Promise.all([
            supabase
                .from("ai_challenges")
                .select("*")
                .eq("user_id", user.id)
                .order("challenge_date", { ascending: false })
                .limit(20),

            supabase
                .from("ai_challenge_evaluations")
                .select("*")
                .eq("user_id", user.id)
                .order("evaluation_date", { ascending: false })
                .limit(20),

            supabase
                .from("ai_analysis")
                .select("*")
                .eq("user_id", user.id)
                .order("analyzed_at", { ascending: false, nullsFirst: false })
                .limit(20),

            supabase
                .from("self_assessments")
                .select("*")
                .eq("user_id", user.id)
                .eq("assessment_type", "pre")
                .limit(20)
        ]);

        if (challengeResult.error) {
            console.warn("ai_challenges 조회 대기:", challengeResult.error.message ?? challengeResult.error);
        } else {
            challengeRows = challengeResult.data ?? [];
        }

        if (evaluationResult.error) {
            console.warn("ai_challenge_evaluations 조회 대기:", evaluationResult.error.message ?? evaluationResult.error);
        } else {
            challengeEvaluationRows = evaluationResult.data ?? [];
        }

        if (aiAnalysisResult.error) {
            console.warn("ai_analysis 조회 대기:", aiAnalysisResult.error.message ?? aiAnalysisResult.error);
        } else {
            aiAnalysisRows = aiAnalysisResult.data ?? [];
        }

        if (selfAssessmentResult.error) {
            console.warn(
                "self_assessments 조회 대기:",
                selfAssessmentResult.error.message
                ?? selfAssessmentResult.error
            );
        } else {
            selfAssessmentRows =
                selfAssessmentResult.data
                ?? [];
        }
    }
    catch (error) {
        console.warn("AI/Challenge 데이터 조회 대기:", error?.message ?? error);
    }

    const challengeComparison = buildChallengeComparison(
        challengeRows,
        challengeEvaluationRows,
        metricRows
    );


    const dailyBehaviorComparison =
        buildDailyBehaviorComparison(
            metricRows,
            today
        );


    /*
        AI 리포트는 "오늘 사용자가 실행한 일간 분석"만 표시합니다.
        어제/과거 분석이 오늘 리포트에 섞이지 않도록 날짜와 period를 함께 확인합니다.
    */
    const latestAiAnalysis =
        aiAnalysisRows.find((item) =>
            item
            && item.analysis_date === today
            && item.period_type === "daily"
            && item.analyzed_at
            && item.summary
            && item.habit_pattern
        )
        ?? null;


    const latestAiEnvelope =
        parseStoredAiEnvelope(
            latestAiAnalysis
                ?.perception_gap
        );

    const activeChallenge =
        challengeRows.find((item) => item?.status === "active")
        ?? null;

    const latestChallenge =
        activeChallenge
        ?? challengeRows[0]
        ?? null;

    const aiAnalysis = latestAiAnalysis
        ? {
            id: latestAiAnalysis.id ?? null,
            periodType: latestAiAnalysis.period_type ?? null,
            analysisDate: latestAiAnalysis.analysis_date ?? null,
            analyzedAt: latestAiAnalysis.analyzed_at ?? null,
            summary: latestAiAnalysis.summary ?? "",
            habitPattern: latestAiAnalysis.habit_pattern ?? "",
            learningDirection: latestAiAnalysis.learning_direction ?? "",
            solutionSuggestions: latestAiAnalysis.solution_suggestions ?? "",

            /*
                Gemini 자기인식 비교 문장은 perception_gap JSON envelope에
                저장되어 있으므로 다른 기기에서도 다시 읽어 사용합니다.
            */
            selfAwarenessInterpretation:
                latestAiEnvelope
                    ?.self_awareness_interpretation
                ?? null,

            analyzedInputFingerprint:
                latestAiEnvelope
                    ?.analyzed_input_fingerprint
                ?? null
        }
        : null;

    const currentChallenge = latestChallenge
        ? {
            id: latestChallenge.id ?? null,
            challengeDate: latestChallenge.challenge_date ?? null,
            title: latestChallenge.title ?? "",
            description: latestChallenge.description ?? "",
            targetMetric: latestChallenge.target_metric ?? "",
            targetValue: latestChallenge.target_value ?? null,
            baselineValue: latestChallenge.baseline_value ?? null,
            resultValue: latestChallenge.result_value ?? null,
            status: latestChallenge.status ?? ""
        }
        : null;


    const selfAwarenessComparison =
        buildSelfAwarenessComparison(
            selfAssessmentRows,
            metricRows,
            appRows,
            today
        );


    /* =====================================
       오늘 데이터
    ===================================== */

    const todayMetric =
        metricRows.find(
            (item) =>
                item.record_date
                ===
                today
        )
        ?? null;


    const todayApps =
        appRows.filter(
            (item) =>
                item.record_date
                ===
                today
        );


    /* =====================================
       앱 데이터 변환
    ===================================== */

    const apps =
        todayApps
            .map(
                (item) => ({

                    packageName:
                        item.package_name,

                    name:
                        item.app_name
                        ||
                        item.package_name,

                    category:
                        item.category
                        ||
                        "기타",

                    activityType:
                        getActivityType(
                            item.category
                        ),

                    usageMinutes:
                        msToMinutes(
                            item.usage_ms
                        ),

                    launches:
                        calculateLaunches(
                            item,
                            transitions
                        )

                })
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.usageMinutes
                    -
                    a.usageMinutes
            );


    /* =====================================
       반복 루프
    ===================================== */

    const repeatLoops =
        loopRows.map(
            (item) => ({

                route:
                    parseLoopPath(
                        item
                    ),

                count:
                    Number(
                        item.loop_count
                        ?? 0
                    ),

                averageDurationMs:
                    Number(
                        item.average_duration_ms
                        ?? 0
                    )

            })
        );


    /* =====================================
       기간별 앱 사용량
    ===================================== */

    const weeklyApps =
        appRows.filter(
            (item) =>
                item.record_date
                >=
                sevenDaysAgo
        );


    const monthlyApps =
        appRows;


    const periodUsage = {

        daily: {

            label:
                "오늘",

            categories:
                aggregateCategoryUsage(
                    todayApps
                )

        },


        weekly: {

            label:
                "최근 7일",

            categories:
                aggregateCategoryUsage(
                    weeklyApps
                )

        },


        monthly: {

            label:
                "최근 30일",

            categories:
                aggregateCategoryUsage(
                    monthlyApps
                )

        }

    };


    /* =====================================
       최종 데이터
    ===================================== */

    const usageData = {

        date:
            today,


        totalUsageHours:
            Number(
                todayMetric?.t_hours
                ?? 0
            ),


        appSwitchCount:
            Number(
                todayMetric?.n_switches
                ?? 0
            ),


        categorySwitchCount:
            Number(
                todayMetric
                    ?.c_category_switches
                ?? 0
            ),


        repeatLoopCount:
            Number(
                todayMetric
                    ?.r_repeat_loops
                ?? 0
            ),


        apps,


        categoryOverrides,


        /*
            현재 DB에는 시간대별 원시 이벤트가
            저장되어 있지 않으므로
            가짜 데이터를 사용하지 않습니다.
        */

        timeline:
            hourlyTimeline,


        repeatLoops,


        transitions:
            transitions.map(
                (item) => ({

                    fromPackage:
                        item.from_package,

                    fromApp:
                        item.from_app,

                    fromCategory:
                        item.from_category,

                    toPackage:
                        item.to_package,

                    toApp:
                        item.to_app,

                    toCategory:
                        item.to_category,

                    count:
                        Number(
                            item.transition_count
                            ?? 0
                        )

                })
            ),


        periodUsage,


        /*
            시간대별 데이터는
            Android 저장 구조를 추가한 뒤
            실제 값으로 연결합니다.
        */

        heatmap:
            hourlyVisualization.heatmap,


        ddiHeatmap:
            hourlyVisualization.ddiHeatmap,


        ddiHourlyDetails:
            hourlyDdiDetails,


        challengeComparison,


        dailyBehaviorComparison,


        aiAnalysis,


        currentChallenge,


        selfAwarenessComparison,


        weeklyReport:
            buildWeeklyReport(
                metricRows
            ),


        monthlyReport:
            buildMonthlyReport(
                metricRows
            )

    };


    console.log(
        "Echo Path 실제 사용 데이터:",
        usageData
    );


    return usageData;
}


/* =========================================
   기존 테스트 함수도 유지
========================================= */

export async function loadTodaySupabaseData() {

    return await loadEchoPathUsageData();

}
