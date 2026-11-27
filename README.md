|                                                                                                                                                |                                                                                                                                                      |                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| <img width="128" height="128" alt="uchi-mata-128-mat" src="https://github.com/user-attachments/assets/abb8251e-4f9d-4a2f-b7d5-a864c6574255" /> | <img width="128" height="128" alt="tomoe-nage-128-mat" src="https://github.com/user-attachments/assets/12e2e488-5084-490a-8c8a-af1e11b98869" />      | <img width="128" height="128" alt="osoto-gari-128-mat" src="https://github.com/user-attachments/assets/04ac3287-e489-4dd7-990a-e82b039583a9" /> |
| uchi mata                                                                                                                                      | tomoe nage                                                                                                                                           | osoto gari                                                                                                                                      |
| <img width="128" height="128" alt="seoi-nage-128-mat" src="https://github.com/user-attachments/assets/210b3acd-cc70-4dc5-945a-67e8bc9b4720" /> | <img width="128" height="128" alt="ko-uchi-gari-v1-128-mat" src="https://github.com/user-attachments/assets/adb01f89-f13a-4d1d-bad8-b8ada82c04fc" /> |                                                                                                                                                 |
| seoi nage                                                                                                                                      | ko uchi gari                                                                                                                                         |                                                                                                                                                 |

---

## 개발 시작하기

필요: [mise](https://mise.jdx.dev), ffmpeg. Node와 pnpm 버전은 `mise.toml`이 맞춰 줍니다.

```
mise trust && mise install
pnpm install
pnpm dev        # http://localhost:5180
pnpm test
pnpm run export --format gif --size 128                # 전체 기술
pnpm run export -t seoi-nage --format webp --size 512  # 하나만
pnpm run export -t ko-uchi-gari                        # 모든 방식
pnpm run export --category ashi-waza                  # 발기술만
pnpm run export --mat                                  # 다다미 포함
pnpm run export -t seoi-nage --view side               # 측면에서 내보내기
pnpm run export -t kesa-gatame --view three-quarter --mat # 곁누르기 사선 뷰
```

- `src/core/rig.ts` 좌우를 구분하는 3D 뼈대. 무릎은 한 방향 경첩
- `src/core/motion.ts` 키프레임을 속도가 이어지는 곡선으로 보간 (의도)
- `src/core/physics.ts` 몸끼리, 몸과 바닥의 접촉을 풀어 최종 자세 계산 (물리). 기술마다 한 번 계산해 저장
- `src/core/scene.ts`, `raster.ts` 장면 생성, 픽셀 단위 깊이의 CPU 렌더러
- `src/core/mat.ts` 다다미 바닥. 인물과 분리된 레이어
- `src/techniques` 기술 데이터. 파일 하나를 추가하고 `index.ts`에 등록하면 끝
- `src/gpu` WebGL2 엔진과 `<judo-motion>` 웹 컴포넌트
- `server` ffmpeg 내보내기 API와 CLI. 결과는 `exports/`

CPU 렌더러(`core/raster.ts`)와 셰이더(`src/gpu/shaders/`)는 같은 알고리즘이므로 함께 수정해야 합니다. GLSL 파일은 빌드할 때 JS에 포함됩니다. VS Code에서는 작업 영역의 GLSL 구문 강조 확장을 사용할 수 있습니다.

## 동작 규칙

메치기 기술은 오른손잡이 기준이며 `test/rules.test.ts`가 검사합니다.

- 오른손은 가슴깃, 왼손은 소매깃. 메친 뒤 오른손을 소매깃으로 옮겨 잡는다.
- 오른발이 먼저 들어가고 왼발이 따라간다. 들어가는 동안 상대는 제자리에 있다.
- 잔발 없이 2스텝: 앞발이 나가면 뒷발이 바로 따라붙고, 뒷발이 닿을 때 이미 공격이 나간다.
- 받는 사람은 측방낙법: 왼다리는 펴고 오른무릎은 90도. 뒤로 넘어가는 기술은 후방낙법(`ukemi: 'back'`): 등을 평평하게, 턱을 당기고 두 손으로 바닥을 친다.
- 업어치기: 두 발은 11자, 사선으로 놓는다.
- 밭다리후리기: 오른다리로 상대 오른다리를 건다.
- 안뒤축걸기: 오른 발바닥으로 상대 오른발 뒤꿈치를 안쪽에서 쓴다. 끌어서 걸기(`draws: true`)와 들어가서 걸기 두 방식이 있다. 개별 내보내기에는 각각 기존 재생 ID `ko-uchi-gari-v1`과 `ko-uchi-gari-v2`를 사용한다.
- 배대뒤치기: 오른발이 상대 두 발 사이로 깊이 들어가고, 따라오는 왼발을 배에 대어 누우며 머리 너머로 넘긴다. 마무리는 왼손만 소매를 잡는다(`keepsLapel`).
- 허벅다리걸기: 오른발이 깊이 들어가고, 오른 팔꿈치는 하늘을 향한다.

곁누르기(`kesa-gatame`)는 누르기(`kind: "osaekomi"`) 기술입니다. 매트 위에서 진입해 누르기를 유지하고, 받기가 엉덩이를 들어 탈출을 시도하면 지지를 유지한 상태로 대응합니다.

## 물리 규칙

`test/physics.test.ts`가 144fps 간격으로 검사합니다.

- 두 사람의 몸은 서로 통과하지 않는다 (허용 오차 1.5, 키 50 기준).
- 무릎은 앞뒤 한 방향으로만 접히고, 고관절은 사람의 범위를 벗어나지 않는다.
- 어깨 높이의 팔은 등 뒤로 꺾이지 않는다. 착지한 사람은 바닥에 닿아 있다.
- 관절이 한 프레임에 순간이동하지 않는다.

키프레임 자체가 상대를 통과하면 솔버가 억지로 밀어내 어색해집니다. 이때는 경유 키프레임을 추가하세요.

## 캐릭터

동작(뼈대·키프레임·물리)과 겉모습은 분리되어 있습니다. `src/characters/index.ts`의 `CHARACTERS`에 항목을 추가하면 모든 기술에 바로 적용됩니다. 새 머리 모양은 `src/characters/head.ts`에 추가합니다.

```
pnpm run export -t seoi-nage --tori bear --uke cat --toriGi black --ukeGi red
```

뼈 길이(키, 팔다리 비율)를 바꾸려면 기술별 키프레임을 다시 맞춰야 합니다.

## 다른 프로젝트에서 쓰기

```
pnpm add @uos-judo-jiho/judo-motion
```

React 19 (SSR 지원):

```tsx
import { JudoMotion } from "@uos-judo-jiho/judo-motion/react";

<JudoMotion technique="seoi-nage" tori="bear" uke="cat" mat className="w-48" />;
```

그 외 번들러는 `import "@uos-judo-jiho/judo-motion"` 후 `<judo-motion technique="seoi-nage"></judo-motion>`을 씁니다. 번들러가 없으면 Release의 `judo-motion.js` 하나를 `<script type="module">`로 불러옵니다.

- 속성: `technique` `view`(`front`/`three-quarter`/`side`) `tori` `uke` `tori-gi` `uke-gi` `grid`(64/96/128) `fps`(0=화면 주사율) `speed` `paused` `mat`(빈 값/`wide`)
- 프로퍼티: `view` `currentTime`(초) `info` `onFrame`
- 목록과 검사: `TECHNIQUES` `TECHNIQUE_CATEGORIES` `CHARACTERS` `GIS` `isTechnique` `isCharacter` `isGi`
- 타입: `TechniqueName` `CharacterId` `GiId` `JudoMotionElement` `JudoMotionProps`

### 기술 분류

`TECHNIQUES`에는 재생하고 내보낼 수 있는 기술과 변형이 들어 있습니다.
`category`는 말단 분류 ID이며, `TECHNIQUE_CATEGORIES`에서 대분류, 중분류, 한글 명칭을 조회할 수 있습니다. 기존 `group`은 표시 문자열이며 `kind`는 애니메이션 유형입니다.

```ts
import { TECHNIQUES, TECHNIQUE_CATEGORIES } from "@uos-judo-jiho/judo-motion";

const footTechniques = TECHNIQUES.filter((t) => t.category === "ashi-waza");
const grappling = TECHNIQUES.filter(
  (t) => TECHNIQUE_CATEGORIES[t.category].group === "katame-waza",
);
```

CLI의 `--category`는 말단 분류 ID뿐 아니라 `nage-waza` 같은 대분류와 `tachi-waza` 같은 중분류도 받습니다. `--technique`와 함께 지정하면 두 조건을 모두 충족하는 기술을 내보냅니다.

### 전체 기술 카탈로그

`TECHNIQUE_CATALOG`는 고도칸 100개 기술의 표준 ID, 이름, 분류와 연결된 애니메이션 ID를 제공합니다. 카탈로그의 `id`는 표준 ID이며 공개 재생 ID와 다를 수 있습니다. 예를 들어 `o-soto-gari`에는 기존 재생 ID `osoto-gari`가 연결됩니다. 한국어 임시 번역에는 `provisionalKo: true`가 표시됩니다. [분류 및 한국어 이름 출처](https://github.com/uos-judo-jiho/judo-motion/issues/7#issuecomment-7211866548)

```ts
import {
  TECHNIQUE_CATALOG,
  TECHNIQUE_STATUS,
} from "@uos-judo-jiho/judo-motion";

const backlog = TECHNIQUE_CATALOG.filter(
  (technique) => technique.__meta.status === TECHNIQUE_STATUS.UNIMPLEMENTED,
);
```

`__meta.status`가 `available`이면 현재 소스에서 재생할 수 있습니다. `__meta.since`는 해당 기술의 애니메이션이 처음 포함된 태그를 확인할 수 있을 때만 표시합니다. `TECHNIQUES`의 각 애니메이션에서도 `canonicalId`와 동일 기술의 `__meta`를 조회할 수 있습니다.

### 릴리스

버전을 올린 변경을 `main`에 반영한 뒤 `package.json`의 버전과 같은 태그를 올립니다. 워크플로는 검사를 통과한 패키지와 단일 JS를 GitHub Release에 첨부합니다.

```sh
git tag v0.1.1
git push origin v0.1.1
```

첫 npm 게시는 npm 조직의 게시 권한이 있는 계정으로 GitHub Release의 패키지 파일을 받아 진행합니다.

```sh
gh release download v0.1.1 --pattern judo-motion-0.1.1.tgz
npm publish ./judo-motion-0.1.1.tgz --access public
```

패키지가 생성되면 npm 패키지 설정에서 Trusted Publisher를 추가합니다. GitHub 조직은 `uos-judo-jiho`, 저장소는 `judo-motion`, 워크플로 파일은 `release.yml`로 설정하고 `npm publish` 권한을 허용합니다. 다음 태그부터 GitHub Release에 첨부한 패키지를 같은 워크플로에서 OIDC로 npm에 게시합니다. [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)

## 개발

oxlint, oxfmt, TypeScript 7, tsdown을 씁니다. `pnpm check`가 CI와 같은 검사를 합니다.

TypeScript 상대 import에는 확장자를 생략합니다. Vite와 tsdown은 번들러 방식으로 경로를 해석하고, Node에서 실행하는 테스트와 CLI는 `tsx`로 같은 import를 해석합니다.

공개 id는 `src/ids.ts`에 먼저 추가합니다. 데이터가 빠지거나 오타가 있으면 컴파일이나 테스트가 실패합니다.

## 라이선스

[MIT](./LICENSE)
