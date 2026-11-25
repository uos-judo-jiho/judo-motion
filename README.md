# 유도 모션 도감

유도 기술을 5등신 도트 애니메이션으로 보여주는 로컬 도구입니다. 웹에서는 WebGL2로 실시간 렌더링하고, 파일은 로컬 ffmpeg로 내보냅니다.

필요: [mise](https://mise.jdx.dev), ffmpeg. Node와 pnpm 버전은 `mise.toml`이 맞춰 줍니다.

```
mise trust && mise install
pnpm install
pnpm dev        # http://localhost:5180
pnpm test
pnpm run export --format gif --size 128                # 전체 기술
pnpm run export -t seoi-nage --format webp --size 512  # 하나만
pnpm run export -t ko-uchi-gari                        # 모든 방식(v1, v2)
pnpm run export --mat                                  # 다다미 포함
```

- `src/core/rig.ts` 좌우를 구분하는 3D 뼈대. 무릎은 한 방향 경첩
- `src/core/motion.ts` 키프레임을 속도가 이어지는 곡선으로 보간 (의도)
- `src/core/physics.ts` 몸끼리, 몸과 바닥의 접촉을 풀어 최종 자세 계산 (물리). 기술마다 한 번 계산해 저장
- `src/core/scene.ts`, `raster.ts` 장면 생성, 픽셀 단위 깊이의 CPU 렌더러
- `src/core/mat.ts` 다다미 바닥. 인물과 분리된 레이어
- `src/techniques` 기술 데이터. 파일 하나를 추가하고 `index.ts`에 등록하면 끝
- `src/gpu` WebGL2 엔진과 `<judo-motion>` 웹 컴포넌트
- `server` ffmpeg 내보내기 API와 CLI. 결과는 `exports/`

CPU 렌더러(`core/raster.ts`)와 셰이더(`gpu/shader.ts`)는 같은 알고리즘이므로 함께 수정해야 합니다.

## 동작 규칙

모든 기술은 오른손잡이 기준이며 `test/rules.test.ts`가 검사합니다.

- 오른손은 가슴깃, 왼손은 소매깃. 메친 뒤 오른손을 소매깃으로 옮겨 잡는다.
- 오른발이 먼저 들어가고 왼발이 따라간다. 들어가는 동안 상대는 제자리에 있다.
- 잔발 없이 2스텝: 앞발이 나가면 뒷발이 바로 따라붙고, 뒷발이 닿을 때 이미 공격이 나간다.
- 받는 사람은 측방낙법: 왼다리는 펴고 오른무릎은 90도. 뒤로 넘어가는 기술은 후방낙법(`ukemi: 'back'`): 등을 평평하게, 턱을 당기고 두 손으로 바닥을 친다.
- 업어치기: 두 발은 11자, 사선으로 놓는다.
- 밭다리후리기: 오른다리로 상대 오른다리를 건다.
- 안뒷축걸기: 오른 발바닥으로 상대 오른발 뒤꿈치를 안쪽에서 쓴다. v1은 끌어서(`draws: true`), v2는 들어가서. v1·v2는 우열이 아니라 방식의 차이다.
- 배대뒤치기: 오른발이 상대 두 발 사이로 깊이 들어가고, 따라오는 왼발을 배에 대어 누우며 머리 너머로 넘긴다. 마무리는 왼손만 소매를 잡는다(`keepsLapel`).
- 허벅다리걸기: 오른발이 깊이 들어가고, 오른 팔꿈치는 하늘을 향한다.

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
<judo-motion technique="seoi-nage" tori="bear" uke="cat" tori-gi="black"></judo-motion>
```

뼈 길이(키, 팔다리 비율)를 바꾸려면 기술별 키프레임을 다시 맞춰야 합니다.

## 다른 프로젝트에서 쓰기

```
pnpm pack:lib      # lib/ 빌드 + judo-motion-0.1.0.tgz 생성
```

순수 HTML: `lib/judo-motion.js`를 복사해 웹 서버로 제공합니다.

```html
<script type="module" src="./judo-motion.js"></script>
<judo-motion technique="seoi-nage" tori="bear" uke="cat" mat style="width:192px"></judo-motion>
```

번들러: `pnpm add <경로>/judo-motion-0.1.0.tgz` 후 `import 'judo-motion'`. React + TypeScript는 `import 'judo-motion/react'`.

속성: `technique` `tori` `uke` `tori-gi` `uke-gi` `grid`(64/96/128) `fps`(0=화면 주사율) `speed` `paused` `mat`(빈 값/`wide`). 프로퍼티: `currentTime`(초), `info`. 목록: `TECHNIQUES` `CHARACTERS` `GIS`.

기술이나 캐릭터를 바꿨다면 `package.json`의 version을 올리고 다시 `pnpm pack:lib` 하세요.
