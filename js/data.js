/* =========================================
   Echo Path
   Development Mock Data

   현재는 테스트용 가상 데이터입니다.
   최종 버전에서는 Android → Supabase의
   실제 사용 데이터로 교체합니다.
========================================= */


export const mockUsageData = {

    date: "2026-08-27",


    /* =====================================
       1. DDI 기본 데이터
    ===================================== */

    totalUsageHours: 4.5,

    appSwitchCount: 32,

    categorySwitchCount: 9,

    repeatLoopCount: 4,


    /* =====================================
       2. 앱별 사용 데이터
    ===================================== */

    apps: [

        {
            name: "Chrome",
            category: "학습",
            activityType: "productive",
            usageMinutes: 85,
            launches: 18
        },

        {
            name: "YouTube",
            category: "미디어",
            activityType: "entertainment",
            usageMinutes: 95,
            launches: 21
        },

        {
            name: "KakaoTalk",
            category: "소통",
            activityType: "productive",
            usageMinutes: 55,
            launches: 26
        },

        {
            name: "Instagram",
            category: "미디어",
            activityType: "entertainment",
            usageMinutes: 25,
            launches: 14
        },

        {
            name: "Coupang",
            category: "쇼핑",
            activityType: "entertainment",
            usageMinutes: 10,
            launches: 4
        }

    ],


    /* =====================================
       3. 앱 이동 타임라인
    ===================================== */

    timeline: [

        {
            time: "09:00",
            app: "Chrome",
            category: "학습",
            durationMinutes: 45
        },

        {
            time: "09:45",
            app: "KakaoTalk",
            category: "소통",
            durationMinutes: 15
        },

        {
            time: "10:00",
            app: "YouTube",
            category: "미디어",
            durationMinutes: 35
        },

        {
            time: "10:35",
            app: "Instagram",
            category: "미디어",
            durationMinutes: 10
        },

        {
            time: "10:45",
            app: "Chrome",
            category: "학습",
            durationMinutes: 40
        }

    ],

    repeatLoops: [

    {
        route: [
            "Instagram",
            "YouTube",
            "KakaoTalk",
            "Instagram"
        ],

        count: 3
    },

    {
        route: [
            "Chrome",
            "YouTube",
            "Chrome"
        ],

        count: 1
    }

],


    /* =====================================
       4. 일간 / 주간 / 월간 카테고리 사용시간

       단위: 분

       이 데이터는 현재 테스트용입니다.
    ===================================== */

    periodUsage: {

        daily: {

            label: "오늘",

            categories: {
                "학습": 85,
                "업무": 0,
                "소통": 55,
                "미디어": 120,
                "쇼핑": 10
            }

        },


        weekly: {

            label: "이번 주",

            categories: {
                "학습": 510,
                "업무": 180,
                "소통": 350,
                "미디어": 620,
                "쇼핑": 95
            }

        },


        monthly: {

            label: "이번 달",

            categories: {
                "학습": 2240,
                "업무": 720,
                "소통": 1510,
                "미디어": 2720,
                "쇼핑": 390
            }

        }

    },


    /* =====================================
       5. 일주일 시간대별 사용 활성도

       값 의미:
       0 = 거의 사용 안 함
       1 = 낮음
       2 = 보통
       3 = 높음
       4 = 매우 높음

       24개 값 = 0시 ~ 23시
    ===================================== */

        /* =====================================
       5. 일주일 시간대별 사용 활성도

       값 의미:
       0 = 거의 사용 안 함
       1 = 낮음
       2 = 보통
       3 = 높음
       4 = 매우 높음

       24개 값 = 0시 ~ 23시
    ===================================== */

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


        values: [

            /* 일요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 2, 2,
                2, 2, 3, 3, 2, 2,
                3, 4, 4, 3, 2, 1
            ],


            /* 월요일 */
            [
                0, 0, 0, 0, 0, 0,
                1, 1, 1, 1, 1, 2,
                1, 1, 2, 3, 3, 2,
                3, 4, 4, 3, 2, 1
            ],


            /* 화요일 */
            [
                0, 0, 0, 0, 0, 0,
                1, 1, 1, 1, 2, 2,
                1, 1, 2, 3, 2, 2,
                3, 3, 4, 4, 2, 1
            ],


            /* 수요일 */
            [
                0, 0, 0, 0, 0, 0,
                1, 1, 1, 2, 2, 2,
                1, 1, 2, 3, 3, 3,
                3, 4, 4, 3, 2, 1
            ],


            /* 목요일 */
            [
                0, 0, 0, 0, 0, 0,
                1, 1, 1, 1, 2, 2,
                1, 2, 2, 3, 3, 2,
                3, 4, 4, 3, 2, 1
            ],


            /* 금요일 */
            [
                0, 0, 0, 0, 0, 0,
                1, 1, 1, 1, 2, 2,
                2, 2, 2, 3, 3, 3,
                4, 4, 4, 4, 3, 2
            ],


            /* 토요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 2, 2, 3,
                2, 3, 3, 3, 3, 3,
                4, 4, 4, 3, 2, 2
            ]

        ]

    },


    /* =====================================
       6. 시간대별 DDI 행동 복잡도

       단순 사용시간이 아니라
       앱 전환 N
       카테고리 전환 C
       반복 루프 R 등이 집중되는 시간을
       0~4 단계로 표현합니다.

       최종 버전에서는 실제 Android 로그를
       시간대별로 계산해 자동 생성합니다.
    ===================================== */

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


        values: [

            /* 일요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 0, 1, 1, 1, 2,
                1, 2, 2, 3, 1, 2,
                3, 4, 3, 2, 2, 1
            ],


            /* 월요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 1, 1,
                1, 1, 3, 4, 4, 2,
                2, 3, 4, 3, 1, 1
            ],


            /* 화요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 1, 2,
                1, 2, 4, 4, 3, 2,
                2, 3, 3, 4, 2, 1
            ],


            /* 수요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 2, 1,
                1, 2, 3, 4, 4, 3,
                3, 3, 4, 3, 2, 1
            ],


            /* 목요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 1, 1,
                1, 2, 3, 4, 3, 2,
                3, 4, 4, 3, 2, 1
            ],


            /* 금요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 1, 2,
                1, 2, 2, 3, 4, 4,
                4, 4, 3, 4, 3, 2
            ],


            /* 토요일 */
            [
                0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 2, 2,
                2, 4, 4, 3, 2, 3,
                4, 4, 3, 2, 2, 1
            ]

        ]

    },

        /* =====================================
       7. 시간대별 DDI 상세 분석

       현재는 테스트 데이터입니다.

       최종 버전에서는 Android 사용 로그를
       시간대별로 분리한 뒤

       T = 사용시간
       N = 앱 전환
       C = 카테고리 전환
       R = 반복 루프

       를 계산하여 자동 생성합니다.
    ===================================== */

    ddiHourlyDetails: [

        {
            startHour: 15,
            endHour: 16,

            ddi: 8.9,

            appSwitchCount: 11,

            categorySwitchCount: 5,

            repeatLoopCount: 2,

            route: [
                "Chrome",
                "Instagram",
                "YouTube",
                "KakaoTalk",
                "Chrome"
            ]
        },


        {
            startHour: 21,
            endHour: 22,

            ddi: 7.6,

            appSwitchCount: 9,

            categorySwitchCount: 4,

            repeatLoopCount: 2,

            route: [
                "YouTube",
                "Instagram",
                "KakaoTalk",
                "YouTube"
            ]
        },


        {
            startHour: 18,
            endHour: 19,

            ddi: 6.2,

            appSwitchCount: 7,

            categorySwitchCount: 3,

            repeatLoopCount: 1,

            route: [
                "KakaoTalk",
                "Chrome",
                "YouTube"
            ]
        },


        {
            startHour: 14,
            endHour: 15,

            ddi: 5.1,

            appSwitchCount: 6,

            categorySwitchCount: 2,

            repeatLoopCount: 1,

            route: [
                "Chrome",
                "YouTube",
                "Chrome"
            ]
        },


        {
            startHour: 10,
            endHour: 11,

            ddi: 4.4,

            appSwitchCount: 5,

            categorySwitchCount: 2,

            repeatLoopCount: 0,

            route: [
                "YouTube",
                "Instagram",
                "Chrome"
            ]
        }

        ],


    /* =====================================
       8. 주간 리포트 데이터

       현재는 테스트용 가상 데이터입니다.

       최종 버전에서는 Supabase에 저장된
       날짜별 실제 사용 데이터를 이용하여
       자동 계산합니다.
    ===================================== */

    weeklyReport: {

        currentWeek: {

            days: [

                {
                    date: "2026-08-23",
                    day: "일",
                    ddi: 40.5,
                    usageMinutes: 245,
                    appSwitchCount: 27,
                    categorySwitchCount: 7,
                    repeatLoopCount: 3
                },

                {
                    date: "2026-08-24",
                    day: "월",
                    ddi: 44.2,
                    usageMinutes: 260,
                    appSwitchCount: 31,
                    categorySwitchCount: 8,
                    repeatLoopCount: 3
                },

                {
                    date: "2026-08-25",
                    day: "화",
                    ddi: 52.8,
                    usageMinutes: 290,
                    appSwitchCount: 39,
                    categorySwitchCount: 11,
                    repeatLoopCount: 5
                },

                {
                    date: "2026-08-26",
                    day: "수",
                    ddi: 38.6,
                    usageMinutes: 225,
                    appSwitchCount: 24,
                    categorySwitchCount: 6,
                    repeatLoopCount: 2
                },

                {
                    date: "2026-08-27",
                    day: "목",
                    ddi: 45.9,
                    usageMinutes: 270,
                    appSwitchCount: 32,
                    categorySwitchCount: 9,
                    repeatLoopCount: 4
                }

            ]

        },


        previousWeek: {

            averageDdi: 48.5,

            averageUsageMinutes: 272

        }

    },


    /* =====================================
       9. 월간 리포트 데이터

       각 주차별 평균값입니다.

       최종 버전에서는 날짜별 실제 데이터를
       주차 단위로 묶어 자동 계산합니다.
    ===================================== */

    monthlyReport: {

        currentMonth: {

            label: "2026년 8월",

            weeks: [

                {
                    week: "1주차",
                    averageDdi: 47.8,
                    averageUsageMinutes: 281
                },

                {
                    week: "2주차",
                    averageDdi: 44.6,
                    averageUsageMinutes: 266
                },

                {
                    week: "3주차",
                    averageDdi: 38.9,
                    averageUsageMinutes: 238
                },

                {
                    week: "4주차",
                    averageDdi: 44.4,
                    averageUsageMinutes: 258
                }

            ]

        },


        previousMonth: {

            averageDdi: 46.7,

            averageUsageMinutes: 275

        }

    }


};

