/* =========================================================
   ECHO PATH
   3D DIGITAL CITY

   MODE 1
   사용시간 T
   → 건물 높이

   MODE 2
   앱 이동 N
   → 출발 앱 색상의 이동 경로

   MODE 3
   반복 루프 R
   → 반복 순환 경로

   INTERACTION
   - 건물 클릭 / 터치
   - 앱 상세정보
   - 선택 앱 관련 이동 경로 강조
   - LOOP 박스 자유 드래그
========================================================= */


/* =========================================================
   1. IMPORT
========================================================= */

import * as THREE
from "three";

import {
    OrbitControls
}
from "three/addons/controls/OrbitControls.js";

import {
    EffectComposer
}
from "three/addons/postprocessing/EffectComposer.js";

import {
    RenderPass
}
from "three/addons/postprocessing/RenderPass.js";

import {
    UnrealBloomPass
}
from "three/addons/postprocessing/UnrealBloomPass.js";

import {
    CSS2DRenderer,
    CSS2DObject
}
from "three/addons/renderers/CSS2DRenderer.js";


/* =========================================================
   2. MAIN
========================================================= */

export function renderDigitalCity(
    usageData
) {

    const mapPage =
        document.querySelector(
            "#mapPage"
        );

    if (!mapPage) {
        console.error(
            "mapPage를 찾을 수 없습니다."
        );
        return;
    }


    /* =====================================================
       기존 도시 제거
    ===================================================== */

    const existingCity =
        document.querySelector(
            "#digitalCitySection"
        );

    if (existingCity) {
        existingCity.remove();
    }


    /* =====================================================
       STYLE
    ===================================================== */

    injectDigitalCityStyles();


    /* =====================================================
       3. HTML
    ===================================================== */

    const citySection =
        document.createElement(
            "section"
        );

    citySection.id =
        "digitalCitySection";

    citySection.className =
        "digital-city-card digital-city-v5";

    citySection.innerHTML = `

        <div class="digital-city-header">

            <div>

                <p class="section-label">
                    DIGITAL CITY
                </p>

                <h3>
                    오늘의 디지털 활동 도시
                </h3>

            </div>

        </div>


        <p
            id="cityModeDescription"
            class="digital-city-description"
        >
            앱 사용시간이 길수록 건물이 높아집니다.
        </p>


        <div class="city-mode-selector">

            <button
                type="button"
                class="city-mode-button active"
                data-city-mode="usage"
            >

                <span class="city-mode-symbol">
                    T
                </span>

                <span>
                    사용시간
                </span>

            </button>


            <button
                type="button"
                class="city-mode-button"
                data-city-mode="movement"
            >

                <span class="city-mode-symbol">
                    N
                </span>

                <span>
                    앱 이동
                </span>

            </button>


            <button
                type="button"
                class="city-mode-button"
                data-city-mode="loop"
            >

                <span class="city-mode-symbol">
                    R
                </span>

                <span>
                    반복 루프
                </span>

            </button>

        </div>


        <div
            id="digitalCityCanvas"
            class="digital-city-canvas digital-city-v5-canvas"
        ></div>


        <div
            id="cityAppDetail"
            class="city-app-detail hidden"
        >

            <div class="city-app-detail-header">

                <div>

                    <span class="city-app-detail-label">
                        APP DETAIL
                    </span>

                    <strong id="cityDetailAppName">
                        -
                    </strong>

                </div>


                <button
                    id="cityDetailClose"
                    class="city-detail-close"
                    type="button"
                    aria-label="앱 상세정보 닫기"
                >
                    ×
                </button>

            </div>


            <div class="city-app-detail-grid">

                <div>

                    <span>
                        사용시간
                    </span>

                    <strong id="cityDetailUsage">
                        -
                    </strong>

                </div>


                <div>

                    <span>
                        실행 횟수
                    </span>

                    <strong id="cityDetailLaunches">
                        -
                    </strong>

                </div>


                <div>

                    <span>
                        카테고리
                    </span>

                    <strong id="cityDetailCategory">
                        -
                    </strong>

                </div>


                <div>

                    <span>
                        사용 비중
                    </span>

                    <strong id="cityDetailShare">
                        -
                    </strong>

                </div>

            </div>


            <div
                id="cityMovementDetail"
                class="city-movement-detail hidden"
            >

                <div>

                    <span>
                        가장 많이 이동한 앱
                    </span>

                    <strong id="cityTopOutgoing">
                        -
                    </strong>

                </div>


                <div>

                    <span>
                        가장 많이 들어온 앱
                    </span>

                    <strong id="cityTopIncoming">
                        -
                    </strong>

                </div>

            </div>


            <p
                id="cityDetailInsight"
                class="city-app-detail-insight"
            >
            </p>

        </div>


        <div
            id="cityModeInfo"
            class="city-mode-info"
        ></div>


        <div class="digital-city-guide">

            <span>
                드래그 · 도시 회전
            </span>

            <span>
                스크롤 · 확대/축소
            </span>

            <span>
                건물 클릭 · 앱 상세정보
            </span>

            <span>
                앱 이동 모드 · 관련 경로 강조
            </span>

            <span>
                LOOP 박스 · 드래그 이동
            </span>

        </div>

    `;


    mapPage.appendChild(
        citySection
    );


    /* =====================================================
       4. DOM
    ===================================================== */

    const container =
        document.querySelector(
            "#digitalCityCanvas"
        );

    const modeDescription =
        document.querySelector(
            "#cityModeDescription"
        );

    const modeInfo =
        document.querySelector(
            "#cityModeInfo"
        );

    const modeButtons =
        document.querySelectorAll(
            ".city-mode-button"
        );

    const appDetailPanel =
        document.querySelector(
            "#cityAppDetail"
        );

    const appDetailName =
        document.querySelector(
            "#cityDetailAppName"
        );

    const appDetailUsage =
        document.querySelector(
            "#cityDetailUsage"
        );

    const appDetailLaunches =
        document.querySelector(
            "#cityDetailLaunches"
        );

    const appDetailCategory =
        document.querySelector(
            "#cityDetailCategory"
        );

    const appDetailShare =
        document.querySelector(
            "#cityDetailShare"
        );

    const appDetailInsight =
        document.querySelector(
            "#cityDetailInsight"
        );

    const appDetailClose =
        document.querySelector(
            "#cityDetailClose"
        );

    const movementDetail =
        document.querySelector(
            "#cityMovementDetail"
        );

    const topOutgoingElement =
        document.querySelector(
            "#cityTopOutgoing"
        );

    const topIncomingElement =
        document.querySelector(
            "#cityTopIncoming"
        );


    const width =
        Math.max(
            container.clientWidth,
            300
        );

    const height =
        520;


    /* =====================================================
       5. SCENE
    ===================================================== */

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x010208
        );

    scene.fog =
        new THREE.Fog(
            0x010208,
            28,
            50
        );


    /* =====================================================
       6. CAMERA
    ===================================================== */

    const camera =
        new THREE.PerspectiveCamera(

            42,

            width / height,

            0.1,

            120

        );

    camera.position.set(
        18,
        15,
        24
    );


    /* =====================================================
       7. WEBGL
    ===================================================== */

    const renderer =
        new THREE.WebGLRenderer({

            antialias:
                true

        });

    renderer.setSize(
        width,
        height
    );

    renderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            2
        )

    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure =
        0.78;

    container.appendChild(
        renderer.domElement
    );


    /* =====================================================
       8. LABEL
    ===================================================== */

    const labelRenderer =
        new CSS2DRenderer();

    labelRenderer.setSize(
        width,
        height
    );

    labelRenderer.domElement.style.position =
        "absolute";

    labelRenderer.domElement.style.left =
        "0";

    labelRenderer.domElement.style.top =
        "0";

    labelRenderer.domElement.style.pointerEvents =
        "none";

    container.appendChild(
        labelRenderer.domElement
    );


    /* =====================================================
       9. BLOOM
    ===================================================== */

    const renderPass =
        new RenderPass(
            scene,
            camera
        );

    const bloomPass =
        new UnrealBloomPass(

            new THREE.Vector2(
                width,
                height
            ),

            0.62,
            0.20,
            0.73

        );

    const composer =
        new EffectComposer(
            renderer
        );

    composer.addPass(
        renderPass
    );

    composer.addPass(
        bloomPass
    );


    /* =====================================================
       10. CONTROLS
    ===================================================== */

    const controls =
        new OrbitControls(
            camera,
            renderer.domElement
        );

    controls.enableDamping =
        true;

    controls.dampingFactor =
        0.065;

    controls.target.set(
        0,
        2,
        0
    );

    controls.minDistance =
        12;

    controls.maxDistance =
        42;

    controls.maxPolarAngle =
        Math.PI / 2.08;


    /* =====================================================
       11. LIGHT
    ===================================================== */

    scene.add(

        new THREE.AmbientLight(
            0x26385f,
            0.34
        )

    );

    const directionalLight =
        new THREE.DirectionalLight(

            0x8aa9ff,
            0.35

        );

    directionalLight.position.set(
        10,
        15,
        10
    );

    scene.add(
        directionalLight
    );


    /* =====================================================
       12. GROUND
    ===================================================== */

    const ground =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                44,
                44
            ),

            new THREE.MeshStandardMaterial({

                color:
                    0x02050b,

                roughness:
                    0.72,

                metalness:
                    0.34

            })

        );

    ground.rotation.x =
        -Math.PI / 2;

    scene.add(
        ground
    );


    /* =====================================================
       13. GRID
    ===================================================== */

    const grid =
        new THREE.GridHelper(

            44,

            44,

            0x176cff,

            0x102452

        );

    grid.position.y =
        0.018;

    grid.material.transparent =
        true;

    grid.material.opacity =
        0.40;

    scene.add(
        grid
    );


    /* =====================================================
       14. DATA
    ===================================================== */

    const apps =
        usageData.apps;

    if (
        !Array.isArray(apps)
        ||
        apps.length === 0
    ) {

        console.error(
            "앱 데이터가 없습니다."
        );

        return;

    }


    const totalUsageMinutes =
        apps.reduce(

            (
                total,
                app
            ) =>

                total
                +
                (
                    app.usageMinutes
                    ||
                    0
                ),

            0

        );


    /* =====================================================
       15. GROUP
    ===================================================== */

    const buildingGroup =
        new THREE.Group();

    const movementGroup =
        new THREE.Group();

    const loopGroup =
        new THREE.Group();

    scene.add(
        buildingGroup
    );

    scene.add(
        movementGroup
    );

    scene.add(
        loopGroup
    );


    const draggableLoopLabels =
        [];

    const clickableBuildings =
        [];

    const movementVisuals =
        [];


    let selectedBuilding =
        null;

    let currentMode =
        "usage";


    /* =====================================================
       16. COLOR
    ===================================================== */

    function getAppColor(
        app
    ) {

        const appColors = {

            "YouTube":
                0x00cfff,

            "Chrome":
                0xff2d7f,

            "KakaoTalk":
                0x23ff70,

            "Instagram":
                0xb64cff,

            "Coupang":
                0xff9d00

        };


        if (
            appColors[
                app.name
            ]
        ) {

            return appColors[
                app.name
            ];

        }


        const categoryColors = {

            "학습":
                0x00cfff,

            "업무":
                0x31ff9a,

            "소통":
                0x38ff80,

            "미디어":
                0xff348b,

            "쇼핑":
                0xffa31a

        };


        return (

            categoryColors[
                app.category
            ]

            ||

            0x6a86ff

        );

    }


    /* =====================================================
       17. MAP
    ===================================================== */

    const appPositionMap =
        {};

    const appColorMap =
        {};


    /* =====================================================
       18. BUILDING POSITION
    ===================================================== */

    const columns =
        Math.ceil(

            Math.sqrt(
                apps.length
            )

        );

    const totalRows =
        Math.ceil(

            apps.length
            /
            columns

        );

    const spacing =
        6.5;


    /* =====================================================
       19. BUILDINGS
    ===================================================== */

    apps.forEach(

        (
            app,
            index
        ) => {

            const column =
                index % columns;

            const row =
                Math.floor(
                    index / columns
                );


            const x =
                (

                    column

                    -
                    (
                        columns - 1
                    )
                    / 2

                )
                *
                spacing;


            const z =
                (

                    row

                    -
                    (
                        totalRows - 1
                    )
                    / 2

                )
                *
                spacing;


            const buildingHeight =
                Math.max(

                    1.6,

                    app.usageMinutes
                    /
                    16

                );


            const buildingWidth =
                2.15;


            const color =
                getAppColor(
                    app
                );


            appPositionMap[
                app.name
            ] = {

                x,
                z,

                width:
                    buildingWidth,

                height:
                    buildingHeight

            };


            appColorMap[
                app.name
            ] =
                color;


            createBuilding({

                app,

                x,

                z,

                width:
                    buildingWidth,

                height:
                    buildingHeight,

                color

            });

        }

    );


    /* =====================================================
       20. MOVEMENT DATA
    ===================================================== */

    const movementData =
        buildMovementData(
            usageData
        );

    createMovementLayer(
        movementData
    );


    /* =====================================================
       21. LOOP
    ===================================================== */

    const loopData =
        buildLoopData(
            usageData
        );

    createLoopLayer(
        loopData
    );


    /* =====================================================
       22. BUILDING
    ===================================================== */

    function createBuilding({

        app,

        x,

        z,

        width,

        height,

        color

    }) {

        const geometry =
            new THREE.BoxGeometry(

                width,

                height,

                width

            );


        const material =
            new THREE.MeshStandardMaterial({

                color:
                    0x040811,

                roughness:
                    0.38,

                metalness:
                    0.74

            });


        const building =
            new THREE.Mesh(

                geometry,

                material

            );


        building.position.set(

            x,

            height / 2,

            z

        );


        building.userData = {

            type:
                "appBuilding",

            app,

            color

        };


        clickableBuildings.push(
            building
        );


        buildingGroup.add(
            building
        );


        const edgeMaterial =
            new THREE.LineBasicMaterial({

                color,

                transparent:
                    true,

                opacity:
                    1,

                toneMapped:
                    false

            });


        const edges =
            new THREE.LineSegments(

                new THREE.EdgesGeometry(
                    geometry
                ),

                edgeMaterial

            );


        edges.position.copy(
            building.position
        );


        building.userData.edge =
            edges;


        buildingGroup.add(
            edges
        );


        /* 받침 */

        const base =
            new THREE.LineSegments(

                new THREE.EdgesGeometry(

                    new THREE.BoxGeometry(

                        width + 0.48,

                        0.07,

                        width + 0.48

                    )

                ),

                new THREE.LineBasicMaterial({

                    color,

                    toneMapped:
                        false

                })

            );


        base.position.set(
            x,
            0.07,
            z
        );


        buildingGroup.add(
            base
        );


        /* 옥상 */

        const roofSurface =
            new THREE.Mesh(

                new THREE.PlaneGeometry(

                    width - 0.12,

                    width - 0.12

                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0x02050c,

                    side:
                        THREE.DoubleSide

                })

            );


        roofSurface.rotation.x =
            -Math.PI / 2;


        roofSurface.position.set(

            x,

            height + 0.035,

            z

        );


        buildingGroup.add(
            roofSurface
        );


        const roofFrame =
            new THREE.LineSegments(

                new THREE.EdgesGeometry(

                    new THREE.BoxGeometry(

                        width + 0.12,

                        0.06,

                        width + 0.12

                    )

                ),

                new THREE.LineBasicMaterial({

                    color,

                    toneMapped:
                        false

                })

            );


        roofFrame.position.set(

            x,

            height + 0.055,

            z

        );


        buildingGroup.add(
            roofFrame
        );


        createWindows({

            x,

            z,

            width,

            height,

            color

        });


        /* APP LABEL */

        const label =
            document.createElement(
                "div"
            );


        label.className =
            "city-app-label";


        label.style.setProperty(

            "--app-neon-color",

            "#"
            +
            new THREE.Color(
                color
            ).getHexString()

        );


        label.innerHTML = `

            <strong>
                ${app.name}
            </strong>

            <span>
                ${app.usageMinutes}분
            </span>

        `;


        const labelObject =
            new CSS2DObject(
                label
            );


        labelObject.position.set(

            x,

            height + 0.78,

            z

        );


        buildingGroup.add(
            labelObject
        );

    }


    /* =====================================================
       23. WINDOWS
    ===================================================== */

    function createWindows({

        x,

        z,

        width,

        height,

        color

    }) {

        const floors =
            Math.max(

                2,

                Math.floor(
                    height / 0.5
                )

            );


        const material =
            new THREE.MeshBasicMaterial({

                color,

                transparent:
                    true,

                opacity:
                    0.72,

                side:
                    THREE.DoubleSide,

                toneMapped:
                    false

            });


        for (
            let floor = 0;
            floor < floors;
            floor++
        ) {

            for (
                let column = 0;
                column < 3;
                column++
            ) {


                if (
                    (
                        floor + column
                    )
                    % 3
                    !== 0
                ) {

                    const front =
                        new THREE.Mesh(

                            new THREE.PlaneGeometry(
                                0.20,
                                0.11
                            ),

                            material

                        );


                    front.position.set(

                        x
                        +
                        (
                            column - 1
                        )
                        * 0.53,

                        0.42
                        +
                        floor
                        * 0.47,

                        z
                        +
                        width / 2
                        +
                        0.008

                    );


                    buildingGroup.add(
                        front
                    );

                }


                if (
                    (
                        floor + column
                    )
                    % 2
                    !== 0
                ) {

                    const side =
                        new THREE.Mesh(

                            new THREE.PlaneGeometry(
                                0.20,
                                0.11
                            ),

                            material

                        );


                    side.rotation.y =
                        Math.PI / 2;


                    side.position.set(

                        x
                        +
                        width / 2
                        +
                        0.008,

                        0.42
                        +
                        floor
                        * 0.47,

                        z
                        +
                        (
                            column - 1
                        )
                        * 0.53

                    );


                    buildingGroup.add(
                        side
                    );

                }

            }

        }

    }


    /* =====================================================
       24. MOVEMENT DATA
    ===================================================== */

    function buildMovementData(
        data
    ) {

        /*
            현재 Supabase 구조에서는 실제 앱 이동이
            usageData.transitions에 저장되어 있다.

            timeline은 시간대별 원시 이벤트 테이블을
            아직 만들지 않았기 때문에 비어 있을 수 있다.
            따라서 transitions를 우선 사용한다.
        */

        const transitions =
            Array.isArray(
                data.transitions
            )
                ? data.transitions
                : [];


        /*
            도시 건물은 앱 이름(app.name)을 key로 사용하므로
            transition의 package/app 정보를 실제 건물 이름으로
            안전하게 변환한다.
        */

        function resolveCityAppName(
            appName,
            packageName
        ) {

            const byPackage =
                apps.find(
                    app =>
                        packageName
                        &&
                        app.packageName
                        ===
                        packageName
                );


            if (byPackage) {
                return byPackage.name;
            }


            const byName =
                apps.find(
                    app =>
                        appName
                        &&
                        app.name
                        ===
                        appName
                );


            if (byName) {
                return byName.name;
            }


            return null;
        }


        if (
            transitions.length > 0
        ) {

            const movementMap =
                new Map();


            transitions.forEach(
                transition => {

                    const from =
                        resolveCityAppName(
                            transition.fromApp,
                            transition.fromPackage
                        );


                    const to =
                        resolveCityAppName(
                            transition.toApp,
                            transition.toPackage
                        );


                    if (
                        !from
                        ||
                        !to
                        ||
                        from === to
                        ||
                        !appPositionMap[from]
                        ||
                        !appPositionMap[to]
                    ) {

                        return;

                    }


                    const key =
                        `${from}|||${to}`;


                    const count =
                        Math.max(
                            1,
                            Number(
                                transition.count
                                ?? 1
                            )
                            || 1
                        );


                    if (
                        !movementMap.has(
                            key
                        )
                    ) {

                        movementMap.set(
                            key,
                            {
                                from,
                                to,
                                count: 0
                            }
                        );

                    }


                    movementMap.get(
                        key
                    ).count +=
                        count;

                }
            );


            const result =
                Array.from(
                    movementMap.values()
                );


            if (
                result.length > 0
            ) {

                return result;

            }

        }


        /*
            하위 호환:
            과거 timeline 데이터가 존재하는 경우에만
            기존 방식으로 이동 경로를 만든다.
        */

        const timeline =
            Array.isArray(
                data.timeline
            )
                ? data.timeline
                : [];


        if (
            timeline.length < 2
        ) {

            return [];

        }


        const map =
            new Map();


        for (
            let i = 0;
            i < timeline.length - 1;
            i++
        ) {

            const from =
                timeline[i]?.app;

            const to =
                timeline[i + 1]?.app;


            if (
                !from
                ||
                !to
                ||
                from === to
                ||
                !appPositionMap[from]
                ||
                !appPositionMap[to]
            ) {

                continue;

            }


            const key =
                `${from}|||${to}`;


            if (
                !map.has(
                    key
                )
            ) {

                map.set(
                    key,
                    {
                        from,
                        to,
                        count: 0
                    }
                );

            }


            map.get(
                key
            ).count++;

        }


        return Array.from(
            map.values()
        );

    }


    /* =====================================================
       25. MOVEMENT LAYER
    ===================================================== */

    function createMovementLayer(
        movements
    ) {

        movements.forEach(

            movement => {


                const from =
                    appPositionMap[
                        movement.from
                    ];


                const to =
                    appPositionMap[
                        movement.to
                    ];


                const color =
                    appColorMap[
                        movement.from
                    ];


                if (
                    !from
                    ||
                    !to
                    ||
                    color === undefined
                ) {

                    return;

                }


                const reverseExists =
                    movements.some(

                        other =>

                            other.from
                            === movement.to

                            &&

                            other.to
                            === movement.from

                    );


                const pair =
                    [
                        movement.from,
                        movement.to
                    ].sort();


                const laneSide =

                    movement.from
                    === pair[0]

                        ? 1

                        : -1;


                const dx =
                    to.x
                    -
                    from.x;


                const dz =
                    to.z
                    -
                    from.z;


                const distance =
                    Math.hypot(
                        dx,
                        dz
                    );


                if (
                    distance <= 0
                ) {

                    return;

                }


                const dirX =
                    dx / distance;


                const dirZ =
                    dz / distance;


                const sideX =
                    -dirZ;


                const sideZ =
                    dirX;


                const routeHeight =

                    reverseExists

                        ? (
                            laneSide === 1
                                ? 0.52
                                : 0.28
                        )

                        : 0.26;


                const start =
                    new THREE.Vector3(

                        from.x
                        +
                        dirX * 1.35,

                        routeHeight,

                        from.z
                        +
                        dirZ * 1.35

                    );


                const end =
                    new THREE.Vector3(

                        to.x
                        -
                        dirX * 1.35,

                        routeHeight,

                        to.z
                        -
                        dirZ * 1.35

                    );


                const bend =

                    reverseExists

                        ? 1.75

                        : 0.70;


                const middle =
                    new THREE.Vector3(

                        (
                            start.x
                            +
                            end.x
                        )
                        / 2

                        +
                        sideX
                        *
                        bend
                        *
                        laneSide,


                        routeHeight
                        +
                        0.05,


                        (
                            start.z
                            +
                            end.z
                        )
                        / 2

                        +
                        sideZ
                        *
                        bend
                        *
                        laneSide

                    );


                const curve =
                    new THREE.QuadraticBezierCurve3(

                        start,

                        middle,

                        end

                    );


                const radius =
                    Math.min(

                        0.032
                        +
                        (
                            movement.count - 1
                        )
                        *
                        0.008,

                        0.075

                    );


                const material =
                    new THREE.MeshBasicMaterial({

                        color,

                        transparent:
                            true,

                        opacity:
                            0.82,

                        toneMapped:
                            false

                    });


                const routeMesh =
                    new THREE.Mesh(

                        new THREE.TubeGeometry(

                            curve,

                            60,

                            radius,

                            8,

                            false

                        ),

                        material

                    );


                movementGroup.add(
                    routeMesh
                );


                const arrow =
                    createArrow({

                        curve,

                        position:
                            0.68,

                        color,

                        radius:
                            0.20,

                        height:
                            0.46

                    });


                movementGroup.add(
                    arrow
                );


                const label =
                    createMovementLabel({

                        movement,

                        curve,

                        color

                    });


                movementGroup.add(
                    label
                );


                movementVisuals.push({

                    movement,

                    routeMesh,

                    arrow,

                    label

                });

            }

        );

    }


    /* =====================================================
       26. MOVEMENT LABEL
    ===================================================== */

    function createMovementLabel({

        movement,

        curve,

        color

    }) {

        const label =
            document.createElement(
                "div"
            );


        label.className =
            "city-route-label";


        label.style.setProperty(

            "--route-color",

            "#"
            +
            new THREE.Color(
                color
            ).getHexString()

        );


        label.textContent =
            `×${movement.count}`;


        const object =
            new CSS2DObject(
                label
            );


        const point =
            curve.getPoint(
                0.45
            );


        object.position.copy(
            point
        );


        object.position.y +=
            0.34;


        return object;

    }


    /* =====================================================
       27. LOOP DATA
    ===================================================== */

    function buildLoopData(
        data
    ) {

        if (
            Array.isArray(
                data.repeatLoops
            )
            &&
            data.repeatLoops.length > 0
        ) {

            return data.repeatLoops;

        }


        return [];

    }


    /* =====================================================
       28. LOOP
    ===================================================== */

    function createLoopLayer(
        loops
    ) {

        loops.forEach(

            (
                loop,
                index
            ) => {


                if (
                    !Array.isArray(
                        loop.route
                    )
                    ||
                    loop.route.length < 3
                ) {

                    return;

                }


                let names =
                    [...loop.route];


                if (
                    names[0]
                    ===
                    names[
                        names.length - 1
                    ]
                ) {

                    names =
                        names.slice(
                            0,
                            -1
                        );

                }


                const positions =
                    names
                        .map(
                            name =>
                                appPositionMap[
                                    name
                                ]
                        )
                        .filter(Boolean);


                if (
                    positions.length < 2
                ) {

                    return;

                }


                const loopHeight =
                    1.45
                    +
                    index
                    *
                    0.62;


                let points =
                    positions.map(

                        position =>
                            new THREE.Vector3(

                                position.x,

                                loopHeight,

                                position.z

                            )

                    );


                if (
                    points.length === 2
                ) {

                    const a =
                        points[0];


                    const b =
                        points[1];


                    const dx =
                        b.x - a.x;


                    const dz =
                        b.z - a.z;


                    const distance =
                        Math.hypot(
                            dx,
                            dz
                        )
                        ||
                        1;


                    const sideX =
                        -dz
                        /
                        distance;


                    const sideZ =
                        dx
                        /
                        distance;


                    const centerX =
                        (
                            a.x
                            +
                            b.x
                        )
                        /
                        2;


                    const centerZ =
                        (
                            a.z
                            +
                            b.z
                        )
                        /
                        2;


                    points = [

                        a,

                        new THREE.Vector3(

                            centerX
                            +
                            sideX
                            *
                            2.7,

                            loopHeight,

                            centerZ
                            +
                            sideZ
                            *
                            2.7

                        ),

                        b,

                        new THREE.Vector3(

                            centerX
                            -
                            sideX
                            *
                            2.7,

                            loopHeight,

                            centerZ
                            -
                            sideZ
                            *
                            2.7

                        )

                    ];

                }


                const curve =
                    new THREE.CatmullRomCurve3(

                        points,

                        true,

                        "catmullrom",

                        0.42

                    );


                let color =
                    0xffa31a;


                if (
                    loop.count === 2
                ) {

                    color =
                        0xff6b3d;

                }


                if (
                    loop.count >= 3
                ) {

                    color =
                        0xff2d7f;

                }


                const radius =
                    Math.min(

                        0.055
                        +
                        (
                            loop.count - 1
                        )
                        *
                        0.016,

                        0.10

                    );


                const loopMesh =
                    new THREE.Mesh(

                        new THREE.TubeGeometry(

                            curve,

                            100,

                            radius,

                            10,

                            true

                        ),

                        new THREE.MeshBasicMaterial({

                            color,

                            transparent:
                                true,

                            opacity:
                                0.92,

                            toneMapped:
                                false

                        })

                    );


                loopGroup.add(
                    loopMesh
                );


                const arrow =
                    createArrow({

                        curve,

                        position:
                            0.68,

                        color,

                        radius:
                            0.23,

                        height:
                            0.52

                    });


                loopGroup.add(
                    arrow
                );


                createDraggableLoopLabel({

                    loop,

                    curve,

                    color,

                    index

                });

            }

        );

    }


    /* =====================================================
       29. DRAGGABLE LOOP LABEL
    ===================================================== */

    function createDraggableLoopLabel({

        loop,

        curve,

        color,

        index

    }) {

        const label =
            document.createElement(
                "div"
            );


        label.className =
            "city-loop-draggable-label";


        label.style.setProperty(

            "--loop-color",

            "#"
            +
            new THREE.Color(
                color
            ).getHexString()

        );


        label.innerHTML = `

            <strong>
                ↻ LOOP ×${loop.count}
            </strong>

            <span>
                ${loop.route.join(" → ")}
            </span>

            <small>
                드래그하여 이동
            </small>

        `;


        container.appendChild(
            label
        );


        const anchor =
            curve
                .getPoint(
                    0.15
                )
                .clone();


        const state = {

            element:
                label,

            anchor,

            manuallyMoved:
                false,

            index

        };


        draggableLoopLabels.push(
            state
        );


        let dragging =
            false;


        let startPointerX =
            0;


        let startPointerY =
            0;


        let startLeft =
            0;


        let startTop =
            0;


        label.addEventListener(

            "pointerdown",

            event => {

                event.preventDefault();
                event.stopPropagation();


                dragging =
                    true;


                state.manuallyMoved =
                    true;


                startPointerX =
                    event.clientX;


                startPointerY =
                    event.clientY;


                startLeft =
                    parseFloat(
                        label.style.left
                    )
                    ||
                    0;


                startTop =
                    parseFloat(
                        label.style.top
                    )
                    ||
                    0;


                label.classList.add(
                    "dragging"
                );


                label.setPointerCapture(
                    event.pointerId
                );


                controls.enabled =
                    false;

            }

        );


        label.addEventListener(

            "pointermove",

            event => {

                if (!dragging) {
                    return;
                }


                event.preventDefault();
                event.stopPropagation();


                const dx =
                    event.clientX
                    -
                    startPointerX;


                const dy =
                    event.clientY
                    -
                    startPointerY;


                let left =
                    startLeft
                    +
                    dx;


                let top =
                    startTop
                    +
                    dy;


                const halfWidth =
                    label.offsetWidth
                    /
                    2;


                const halfHeight =
                    label.offsetHeight
                    /
                    2;


                left =
                    Math.max(

                        halfWidth,

                        Math.min(

                            container.clientWidth
                            -
                            halfWidth,

                            left

                        )

                    );


                top =
                    Math.max(

                        halfHeight,

                        Math.min(

                            container.clientHeight
                            -
                            halfHeight,

                            top

                        )

                    );


                label.style.left =
                    `${left}px`;


                label.style.top =
                    `${top}px`;

            }

        );


        function finishDrag(
            event
        ) {

            if (!dragging) {
                return;
            }


            dragging =
                false;


            controls.enabled =
                true;


            label.classList.remove(
                "dragging"
            );


            if (
                event
                &&
                label.hasPointerCapture(
                    event.pointerId
                )
            ) {

                label.releasePointerCapture(
                    event.pointerId
                );

            }

        }


        label.addEventListener(
            "pointerup",
            finishDrag
        );


        label.addEventListener(
            "pointercancel",
            finishDrag
        );

    }


    /* =====================================================
       30. LOOP POSITION
    ===================================================== */

    function updateLoopLabelPositions() {

        draggableLoopLabels.forEach(

            state => {


                if (
                    state.manuallyMoved
                ) {

                    return;

                }


                const projected =
                    state.anchor
                        .clone()
                        .project(
                            camera
                        );


                const x =
                    (
                        projected.x
                        *
                        0.5
                        +
                        0.5
                    )
                    *
                    container.clientWidth;


                const y =
                    (
                        -
                        projected.y
                        *
                        0.5
                        +
                        0.5
                    )
                    *
                    container.clientHeight;


                state.element.style.left =
                    `${
                        x
                        +
                        state.index
                        *
                        18
                    }px`;


                state.element.style.top =
                    `${
                        y
                        +
                        state.index
                        *
                        14
                    }px`;

            }

        );

    }


    /* =====================================================
       31. CREATE ARROW
    ===================================================== */

    function createArrow({

        curve,

        position,

        color,

        radius,

        height

    }) {

        const point =
            curve.getPoint(
                position
            );


        const next =
            curve.getPoint(

                Math.min(
                    position + 0.025,
                    0.995
                )

            );


        const direction =
            new THREE.Vector3()
                .subVectors(
                    next,
                    point
                )
                .normalize();


        const arrow =
            new THREE.Mesh(

                new THREE.ConeGeometry(

                    radius,

                    height,

                    18

                ),

                new THREE.MeshBasicMaterial({

                    color,

                    transparent:
                        true,

                    opacity:
                        1,

                    toneMapped:
                        false

                })

            );


        arrow.position.copy(
            point
        );


        arrow.quaternion
            .setFromUnitVectors(

                new THREE.Vector3(
                    0,
                    1,
                    0
                ),

                direction

            );


        return arrow;

    }


    /* =====================================================
       32. RAYCASTER
    ===================================================== */

    const raycaster =
        new THREE.Raycaster();


    const pointer =
        new THREE.Vector2();


    let pointerDownX =
        0;


    let pointerDownY =
        0;


    let pointerMoved =
        false;


    renderer.domElement.addEventListener(

        "pointerdown",

        event => {

            pointerDownX =
                event.clientX;


            pointerDownY =
                event.clientY;


            pointerMoved =
                false;

        }

    );


    renderer.domElement.addEventListener(

        "pointermove",

        event => {

            const dx =
                event.clientX
                -
                pointerDownX;


            const dy =
                event.clientY
                -
                pointerDownY;


            if (
                Math.hypot(
                    dx,
                    dy
                )
                >
                6
            ) {

                pointerMoved =
                    true;

            }

        }

    );


    renderer.domElement.addEventListener(

        "pointerup",

        event => {

            if (
                pointerMoved
            ) {

                return;

            }


            handleBuildingSelection(
                event
            );

        }

    );


    /* =====================================================
       33. BUILDING SELECTION
    ===================================================== */

    function handleBuildingSelection(
        event
    ) {

        const rect =
            renderer.domElement
                .getBoundingClientRect();


        pointer.x =
            (
                (
                    event.clientX
                    -
                    rect.left
                )
                /
                rect.width
            )
            *
            2
            -
            1;


        pointer.y =
            -
            (
                (
                    event.clientY
                    -
                    rect.top
                )
                /
                rect.height
            )
            *
            2
            +
            1;


        raycaster.setFromCamera(
            pointer,
            camera
        );


        const hits =
            raycaster.intersectObjects(

                clickableBuildings,

                false

            );


        if (
            hits.length === 0
        ) {

            clearBuildingSelection();

            return;

        }


        selectBuilding(
            hits[0].object
        );

    }


    /* =====================================================
       34. SELECT BUILDING
    ===================================================== */

    function selectBuilding(
        building
    ) {

        if (
            selectedBuilding
            &&
            selectedBuilding
            !==
            building
        ) {

            resetBuildingVisual(
                selectedBuilding
            );

        }


        selectedBuilding =
            building;


        const app =
            building.userData.app;


        const color =
            building.userData.color;


        const selectedColor =
            new THREE.Color(
                color
            );


        selectedColor.multiplyScalar(
            0.16
        );


        building.material.color.copy(
            selectedColor
        );


        building.material.emissive.set(
            color
        );


        building.material.emissiveIntensity =
            0.22;


        renderAppDetail(
            app
        );


        /*
            앱 이동 화면일 때만
            관련 경로 강조
        */

        if (
            currentMode ===
            "movement"
        ) {

            highlightMovementRoutes(
                app.name
            );

        }

    }


    /* =====================================================
       35. RESET BUILDING
    ===================================================== */

    function resetBuildingVisual(
        building
    ) {

        building.material.color.set(
            0x040811
        );


        building.material.emissive.set(
            0x000000
        );


        building.material.emissiveIntensity =
            0;

    }


    /* =====================================================
       36. MOVEMENT HIGHLIGHT
    ===================================================== */

    function highlightMovementRoutes(
        appName
    ) {

        movementVisuals.forEach(

            visual => {

                const related =

                    visual.movement.from
                    ===
                    appName

                    ||

                    visual.movement.to
                    ===
                    appName;


                visual.routeMesh.material.opacity =

                    related

                        ? 1

                        : 0.10;


                visual.arrow.material.opacity =

                    related

                        ? 1

                        : 0.08;


                visual.label.visible =
                    related;

            }

        );

    }


    /* =====================================================
       37. RESET MOVEMENT HIGHLIGHT
    ===================================================== */

    function resetMovementHighlight() {

        movementVisuals.forEach(

            visual => {

                visual.routeMesh.material.opacity =
                    0.82;


                visual.arrow.material.opacity =
                    1;


                visual.label.visible =
                    true;

            }

        );

    }


    /* =====================================================
       38. CLEAR SELECTION
    ===================================================== */

    function clearBuildingSelection() {

        if (
            selectedBuilding
        ) {

            resetBuildingVisual(
                selectedBuilding
            );

        }


        selectedBuilding =
            null;


        appDetailPanel.classList.add(
            "hidden"
        );


        resetMovementHighlight();

    }


    /* =====================================================
       39. APP DETAIL
    ===================================================== */

    function renderAppDetail(
        app
    ) {

        const usageMinutes =
            app.usageMinutes
            ||
            0;


        const launches =
            app.launches
            ??
            "-";


        const category =
            app.category
            ||
            "미분류";


        const share =

            totalUsageMinutes > 0

                ? (
                    usageMinutes
                    /
                    totalUsageMinutes
                    *
                    100
                )

                : 0;


        appDetailName.textContent =
            app.name;


        appDetailUsage.textContent =
            `${usageMinutes}분`;


        appDetailLaunches.textContent =

            launches === "-"

                ? "-"

                : `${launches}회`;


        appDetailCategory.textContent =
            category;


        appDetailShare.textContent =
            `${share.toFixed(1)}%`;


        const maxUsage =
            Math.max(

                ...apps.map(

                    item =>
                        item.usageMinutes
                        ||
                        0

                )

            );


        if (
            usageMinutes ===
            maxUsage
        ) {

            appDetailInsight.textContent =
                "오늘 가장 오래 사용한 앱입니다.";

        }

        else {

            appDetailInsight.textContent =
                `오늘 전체 앱 사용시간의 ${share.toFixed(1)}%를 차지했습니다.`;

        }


        if (
            currentMode ===
            "movement"
        ) {

            renderMovementDetail(
                app.name
            );


            movementDetail.classList.remove(
                "hidden"
            );

        }

        else {

            movementDetail.classList.add(
                "hidden"
            );

        }


        appDetailPanel.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       40. MOVEMENT DETAIL
    ===================================================== */

    function renderMovementDetail(
        appName
    ) {

        const outgoing =
            movementData
                .filter(

                    movement =>
                        movement.from
                        ===
                        appName

                )
                .sort(

                    (
                        a,
                        b
                    ) =>
                        b.count
                        -
                        a.count

                );


        const incoming =
            movementData
                .filter(

                    movement =>
                        movement.to
                        ===
                        appName

                )
                .sort(

                    (
                        a,
                        b
                    ) =>
                        b.count
                        -
                        a.count

                );


        if (
            outgoing.length > 0
        ) {

            topOutgoingElement.textContent =
                `${outgoing[0].to} · ${outgoing[0].count}회`;

        }

        else {

            topOutgoingElement.textContent =
                "없음";

        }


        if (
            incoming.length > 0
        ) {

            topIncomingElement.textContent =
                `${incoming[0].from} · ${incoming[0].count}회`;

        }

        else {

            topIncomingElement.textContent =
                "없음";

        }

    }


    /* =====================================================
       41. DETAIL CLOSE
    ===================================================== */

    appDetailClose.addEventListener(

        "click",

        () => {

            clearBuildingSelection();

        }

    );


    /* =====================================================
       42. MODE CONTROL
    ===================================================== */

    function setCityMode(
        mode
    ) {

        currentMode =
            mode;


        clearBuildingSelection();


        modeButtons.forEach(

            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.cityMode
                    ===
                    mode

                );

            }

        );


        buildingGroup.visible =
            true;


        if (
            mode ===
            "usage"
        ) {

            movementGroup.visible =
                false;


            loopGroup.visible =
                false;


            setLoopLabelsVisible(
                false
            );


            modeDescription.textContent =
                "앱 사용시간이 길수록 건물이 높아집니다.";


            renderUsageInfo();

        }


        if (
            mode ===
            "movement"
        ) {

            movementGroup.visible =
                true;


            loopGroup.visible =
                false;


            setLoopLabelsVisible(
                false
            );


            modeDescription.textContent =
                "출발앱과 같은 색의 화살표가 앱 이동 방향을 나타냅니다.";


            renderMovementInfo();

        }


        if (
            mode ===
            "loop"
        ) {

            movementGroup.visible =
                false;


            loopGroup.visible =
                true;


            setLoopLabelsVisible(
                true
            );


            modeDescription.textContent =
                "다시 원래 앱으로 돌아온 반복 순환 패턴만 표시합니다. LOOP 박스는 직접 드래그하여 원하는 위치로 이동할 수 있습니다.";


            renderLoopInfo();

        }

    }


    /* =====================================================
       43. LOOP VISIBILITY
    ===================================================== */

    function setLoopLabelsVisible(
        visible
    ) {

        draggableLoopLabels.forEach(

            state => {

                state.element.style.display =

                    visible

                        ? "flex"

                        : "none";

            }

        );

    }


    modeButtons.forEach(

        button => {

            button.addEventListener(

                "click",

                () => {

                    setCityMode(
                        button.dataset.cityMode
                    );

                }

            );

        }

    );


    /* =====================================================
       44. USAGE INFO
    ===================================================== */

    function renderUsageInfo() {

        const sorted =
            [...apps]
                .sort(

                    (
                        a,
                        b
                    ) =>

                        b.usageMinutes
                        -
                        a.usageMinutes

                );


        const top =
            sorted[0];


        modeInfo.innerHTML = `

            <div class="city-insight-card">

                <span class="city-insight-badge">
                    T · USAGE
                </span>

                <strong>
                    가장 오래 사용한 앱 · ${top.name}
                </strong>

                <p>
                    ${top.usageMinutes}분 사용했습니다.
                    건물 높이는 사용시간을 기준으로 만들어집니다.
                </p>

            </div>

        `;

    }


    /* =====================================================
       45. MOVEMENT INFO
    ===================================================== */

    function renderMovementInfo() {

        if (
            movementData.length === 0
        ) {

            modeInfo.innerHTML = `

                <div class="city-insight-card">

                    <span class="city-insight-badge">
                        N · MOVEMENT
                    </span>

                    <strong>
                        앱 이동 기록이 없습니다.
                    </strong>

                </div>

            `;


            return;

        }


        const sorted =
            [...movementData]
                .sort(

                    (
                        a,
                        b
                    ) =>
                        b.count
                        -
                        a.count

                );


        const top =
            sorted[0];


        modeInfo.innerHTML = `

            <div class="city-insight-card">

                <span class="city-insight-badge">
                    N · MOVEMENT
                </span>

                <strong>
                    가장 잦은 앱 이동
                </strong>

                <p>
                    ${top.from}
                    →
                    ${top.to}
                    ·
                    ${top.count}회
                </p>

                <div class="city-mini-stats">

                    <span>
                        이동 경로
                        <strong>
                            ${movementData.length}
                        </strong>
                    </span>

                </div>

                <p class="city-insight-tip">
                    건물을 선택하면 해당 앱과 연결된 경로만 강조됩니다.
                </p>

            </div>

        `;

    }


    /* =====================================================
       46. LOOP INFO
    ===================================================== */

    function renderLoopInfo() {

        if (
            loopData.length === 0
        ) {

            modeInfo.innerHTML = `

                <div class="city-insight-card">

                    <span class="city-insight-badge">
                        R · LOOP
                    </span>

                    <strong>
                        반복 순환이 감지되지 않았습니다.
                    </strong>

                </div>

            `;


            return;

        }


        const sorted =
            [...loopData]
                .sort(

                    (
                        a,
                        b
                    ) =>
                        b.count
                        -
                        a.count

                );


        const strongest =
            sorted[0];


        modeInfo.innerHTML = `

            <div class="city-insight-card">

                <span class="city-insight-badge">
                    R · LOOP
                </span>

                <strong>
                    가장 많이 반복한 순환
                </strong>

                <p>
                    ${strongest.route.join(" → ")}
                </p>

                <div class="city-mini-stats">

                    <span>
                        반복
                        <strong>
                            ${strongest.count}회
                        </strong>
                    </span>

                    <span>
                        루프 유형
                        <strong>
                            ${loopData.length}
                        </strong>
                    </span>

                </div>

            </div>

        `;

    }


    /* =====================================================
       47. DEFAULT
    ===================================================== */

    setCityMode(
        "usage"
    );


    /* =====================================================
       48. ANIMATION
    ===================================================== */

    function animate() {

        requestAnimationFrame(
            animate
        );


        controls.update();


        composer.render();


        labelRenderer.render(
            scene,
            camera
        );


        updateLoopLabelPositions();

    }


    animate();


    /* =====================================================
       49. RESIZE
    ===================================================== */

    function handleResize() {

        const newWidth =
            container.clientWidth;


        if (
            newWidth <= 0
        ) {

            return;

        }


        camera.aspect =
            newWidth
            /
            height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            newWidth,
            height
        );


        composer.setSize(
            newWidth,
            height
        );


        labelRenderer.setSize(
            newWidth,
            height
        );

    }


    window.addEventListener(
        "resize",
        handleResize
    );


    /* =====================================================
       50. CSS
    ===================================================== */

    function injectDigitalCityStyles() {

        const oldStyle =
            document.querySelector(
                "#echoPathDigitalCityStyles"
            );


        if (oldStyle) {
            oldStyle.remove();
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "echoPathDigitalCityStyles";


        style.textContent = `

            .digital-city-v5-canvas {
                position: relative;
                height: 520px;
                overflow: hidden;
                background: #010208;
            }


            .city-mode-selector {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 7px;
                margin: 14px 0;
            }


            .city-mode-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                gap: 4px;

                min-height: 58px;
                padding: 8px 5px;

                border: 1px solid #e3e8f0;
                border-radius: 12px;

                background: #f6f8fb;
                color: #718096;

                font-size: 11px;
                font-weight: 700;

                cursor: pointer;
            }


            .city-mode-button.active {
                border-color: #3867f4;
                background: #172033;
                color: #ffffff;
            }


            .city-mode-symbol {
                display: flex;
                align-items: center;
                justify-content: center;

                min-width: 25px;
                height: 20px;

                padding: 0 4px;

                border-radius: 6px;

                background: rgba(56, 103, 244, 0.12);

                color: #3867f4;

                font-size: 9px;
                font-weight: 900;
            }


            .city-mode-button.active
            .city-mode-symbol {
                background: rgba(255,255,255,0.10);
                color: #8dacff;
            }


            .city-app-label {
                display: flex;
                flex-direction: column;
                align-items: center;

                color: var(--app-neon-color);

                white-space: nowrap;
                pointer-events: none;

                filter:
                    drop-shadow(
                        0 0 4px
                        var(--app-neon-color)
                    );
            }


            .city-app-label strong {
                font-size: 12px;
                font-weight: 800;
            }


            .city-app-label span {
                margin-top: 2px;
                font-size: 10px;
                font-weight: 700;
            }


            .city-route-label {
                padding: 3px 6px;

                border:
                    1px solid
                    var(--route-color);

                border-radius: 999px;

                background:
                    rgba(3,7,16,0.90);

                color:
                    var(--route-color);

                font-size: 9px;
                font-weight: 900;

                white-space: nowrap;
                pointer-events: none;
            }


            .city-loop-draggable-label {
                position: absolute;

                z-index: 20;

                display: flex;
                flex-direction: column;

                gap: 2px;

                width: 155px;
                max-width: 155px;

                padding: 7px 9px;

                border:
                    1px solid
                    var(--loop-color);

                border-radius: 10px;

                background:
                    rgba(3,6,14,0.96);

                color:
                    var(--loop-color);

                transform:
                    translate(-50%, -50%);

                box-sizing: border-box;

                cursor: grab;

                touch-action: none;
                user-select: none;

                box-shadow:
                    0 0 10px
                    rgba(255,45,127,0.18);
            }


            .city-loop-draggable-label.dragging {
                cursor: grabbing;

                box-shadow:
                    0 0 16px
                    var(--loop-color);
            }


            .city-loop-draggable-label strong {
                font-size: 9px;
                font-weight: 900;
            }


            .city-loop-draggable-label span {
                color: #d6dceb;

                font-size: 8px;
                line-height: 1.35;
            }


            .city-loop-draggable-label small {
                margin-top: 3px;

                color: #7f8aa2;

                font-size: 7px;
            }


            /* =========================================
               APP DETAIL
            ========================================= */

            .city-app-detail {
                margin-top: 12px;
                padding: 14px;

                border: 1px solid #dfe6f0;
                border-radius: 15px;

                background: #ffffff;

                box-shadow:
                    0 8px 22px
                    rgba(23,32,51,0.07);
            }


            .city-app-detail.hidden,
            .city-movement-detail.hidden {
                display: none;
            }


            .city-app-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;

                gap: 12px;

                margin-bottom: 12px;
            }


            .city-app-detail-label {
                display: block;

                margin-bottom: 3px;

                color: #3867f4;

                font-size: 8px;
                font-weight: 900;

                letter-spacing: 0.8px;
            }


            .city-app-detail-header strong {
                color: #172033;

                font-size: 17px;
            }


            .city-detail-close {
                display: flex;
                align-items: center;
                justify-content: center;

                width: 28px;
                height: 28px;

                padding: 0;

                border:
                    1px solid #e4e9f1;

                border-radius: 9px;

                background: #f5f7fb;

                color: #718096;

                font-size: 18px;

                cursor: pointer;
            }


            .city-app-detail-grid {
                display: grid;
                grid-template-columns:
                    repeat(2, 1fr);

                gap: 8px;
            }


            .city-app-detail-grid > div {
                padding: 10px;

                border-radius: 10px;

                background: #f6f8fb;
            }


            .city-app-detail-grid span {
                display: block;

                margin-bottom: 4px;

                color: #718096;

                font-size: 9px;
            }


            .city-app-detail-grid strong {
                color: #172033;

                font-size: 12px;
            }


            /* =========================================
               MOVEMENT DETAIL
            ========================================= */

            .city-movement-detail {
                display: grid;
                grid-template-columns:
                    repeat(2, 1fr);

                gap: 8px;

                margin-top: 8px;
            }


            .city-movement-detail > div {
                padding: 10px;

                border-radius: 10px;

                background: #eef3ff;
            }


            .city-movement-detail span {
                display: block;

                margin-bottom: 4px;

                color: #718096;

                font-size: 9px;
            }


            .city-movement-detail strong {
                color: #172033;

                font-size: 11px;
            }


            .city-app-detail-insight {
                margin: 10px 0 0;

                padding-top: 10px;

                border-top: 1px solid #edf0f5;

                color: #526074;

                font-size: 11px;
                line-height: 1.55;
            }


            /* =========================================
               MODE INFO
            ========================================= */

            .city-mode-info {
                margin-top: 12px;
            }


            .city-insight-card {
                padding: 13px;

                border: 1px solid #e7ebf2;
                border-radius: 13px;

                background: #f6f8fb;
            }


            .city-insight-badge {
                display: inline-block;

                margin-bottom: 6px;

                color: #3867f4;

                font-size: 9px;
                font-weight: 900;

                letter-spacing: 0.7px;
            }


            .city-insight-card > strong {
                display: block;

                margin-bottom: 5px;

                color: #172033;

                font-size: 13px;
            }


            .city-insight-card > p {
                margin: 0;

                color: #718096;

                font-size: 11px;
                line-height: 1.55;
            }


            .city-insight-tip {
                margin-top: 8px !important;

                color: #3867f4 !important;

                font-weight: 700;
            }


            .city-mini-stats {
                display: flex;
                flex-wrap: wrap;

                gap: 6px;

                margin-top: 9px;
            }


            .city-mini-stats span {
                padding: 5px 7px;

                border-radius: 7px;

                background: #ffffff;

                color: #718096;

                font-size: 9px;
            }


            .city-mini-stats strong {
                margin-left: 3px;

                color: #172033;
            }

        `;


        document.head.appendChild(
            style
        );

    }

}