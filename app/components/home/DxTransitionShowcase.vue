<script setup lang="ts">
type TransitionMode = {
  accent: string
  description: string
  icon: string
  id: "entry" | "select" | "result"
  label: string
  metric: string
  title: string
}

const modes: [TransitionMode, ...TransitionMode[]] = [
  {
    accent: "var(--aoi-accent-50)",
    description: "圆环扫入、轨道线展开，适合进入页和加载阶段。",
    icon: "sparkles",
    id: "entry",
    label: "进入",
    metric: "0.42s",
    title: "Circle In"
  },
  {
    accent: "var(--aoi-sun-50)",
    description: "内容卡片横向切换，保留当前页面的轻快节奏。",
    icon: "disc-3",
    id: "select",
    label: "选曲",
    metric: "3 lanes",
    title: "Track Shift"
  },
  {
    accent: "var(--aoi-sakura-50)",
    description: "结算信息弹出，适合成绩、投稿状态和完成反馈。",
    icon: "badge-check",
    id: "result",
    label: "结算",
    metric: "SSS+",
    title: "Result Pop"
  }
]

const activeModeId = ref<TransitionMode["id"]>("entry")
const replayKey = ref(0)
const autoPlay = ref(true)
const activeMode = computed<TransitionMode>(() => modes.find((mode) => mode.id === activeModeId.value) || modes[0])
const activeModeIndex = computed(() => modes.findIndex((mode) => mode.id === activeMode.value.id))
const modeItems = computed(() => modes.map((mode) => ({
  accent: mode.accent,
  icon: mode.icon,
  label: mode.label,
  value: mode.id
})))

function setActiveMode(id: TransitionMode["id"]) {
  activeModeId.value = id
  replayKey.value += 1
}

function selectMode(value: string) {
  const mode = modes.find((item) => item.id === value)

  if (mode) {
    setActiveMode(mode.id)
  }
}

function nextMode() {
  const nextIndex = (activeModeIndex.value + 1) % modes.length
  setActiveMode((modes[nextIndex] || modes[0]).id)
}

function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
}

let autoPlayTimer: number | undefined

onMounted(() => {
  autoPlayTimer = window.setInterval(() => {
    if (autoPlay.value) {
      nextMode()
    }
  }, 2800)
})

onBeforeUnmount(() => {
  if (autoPlayTimer) {
    window.clearInterval(autoPlayTimer)
  }
})
</script>

<template>
  <section class="dx-showcase" aria-labelledby="dx-showcase-title">
    <div class="dx-showcase__copy">
      <p class="dx-showcase__eyebrow">Motion Component</p>
      <h2 id="dx-showcase-title">Aoi DX 转场组件</h2>
      <p class="dx-showcase__description">
        给视频社区首页准备的一版音游感 UI：清透圆环、轨道切线和轻量状态切换，可以复用到加载、分类和结算反馈。
      </p>

      <AoiSegmentedControl
        class="dx-showcase__modes"
        :model-value="activeMode.id"
        :items="modeItems"
        aria-label="转场状态"
        :columns="3"
        selection-role="tab"
        @update:model-value="selectMode"
      />

      <div class="dx-showcase__auto">
        <AoiButton
          variant="outlined"
          size="sm"
          :icon="autoPlay ? 'pause' : 'play'"
          :aria-pressed="autoPlay"
          @click="toggleAutoPlay"
        >
          {{ autoPlay ? "自动转场中" : "播放转场" }}
        </AoiButton>
      </div>
    </div>

    <div class="dx-stage" :class="`dx-stage--${activeMode.id}`" :style="{ '--stage-accent': activeMode.accent }">
      <div :key="`${activeMode.id}-${replayKey}`" class="dx-stage__screen" aria-hidden="true">
        <span class="dx-stage__curtain dx-stage__curtain--left" />
        <span class="dx-stage__curtain dx-stage__curtain--right" />
        <span class="dx-stage__ring dx-stage__ring--outer" />
        <span class="dx-stage__ring dx-stage__ring--inner" />
        <span class="dx-stage__halo" />
        <span class="dx-stage__sweep" />
        <span class="dx-stage__track dx-stage__track--top" />
        <span class="dx-stage__track dx-stage__track--middle" />
        <span class="dx-stage__track dx-stage__track--bottom" />
        <span class="dx-stage__card dx-stage__card--one" />
        <span class="dx-stage__card dx-stage__card--two" />
        <span class="dx-stage__card dx-stage__card--three" />
        <span class="dx-stage__hit dx-stage__hit--one" />
        <span class="dx-stage__hit dx-stage__hit--two" />
        <span class="dx-stage__hit dx-stage__hit--three" />
        <span class="dx-stage__progress" />

        <div class="dx-stage__readout">
          <span>{{ activeMode.label }}</span>
          <strong>{{ activeMode.title }}</strong>
          <small>{{ activeMode.metric }}</small>
        </div>
      </div>

      <div class="dx-stage__meta">
        <span class="dx-stage__pulse" aria-hidden="true" />
        <p>{{ activeMode.description }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dx-showcase {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  gap: 22px;
  align-items: stretch;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(233, 251, 253, 0.58)),
    linear-gradient(110deg, rgba(34, 184, 207, 0.12), transparent 48%, rgba(242, 112, 156, 0.13));
  box-shadow: var(--aoi-shadow-sm);
  margin-bottom: 18px;
  overflow: hidden;
  padding: 18px;
}

.dx-showcase__copy {
  display: grid;
  align-content: center;
  gap: 12px;
  min-width: 0;
}

.dx-showcase__eyebrow {
  margin: 0;
  color: var(--aoi-sakura-50);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.dx-showcase h2 {
  margin: 0;
  color: var(--aoi-text);
  font-size: 24px;
  line-height: 1.2;
}

.dx-showcase__description {
  max-width: 520px;
  margin: 0;
  color: var(--aoi-text-muted);
  line-height: 1.8;
}

.dx-showcase__modes {
  display: inline-grid;
  width: fit-content;
  max-width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: rgba(255, 255, 255, 0.7);
  padding: 4px;
}

.dx-showcase__auto {
  display: inline-flex;
  width: fit-content;
}

.dx-stage {
  display: grid;
  min-width: 0;
  gap: 10px;
}

.dx-stage__screen {
  position: relative;
  min-height: 214px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: var(--aoi-radius-md);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent 42%),
    linear-gradient(135deg, var(--aoi-accent-50), var(--aoi-secondary-50) 48%, var(--aoi-sakura-50));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  animation: dx-screen-pop 760ms var(--aoi-ease-out) both;
}

.dx-stage__ring,
.dx-stage__curtain,
.dx-stage__card,
.dx-stage__halo,
.dx-stage__progress,
.dx-stage__sweep,
.dx-stage__track,
.dx-stage__hit {
  position: absolute;
  pointer-events: none;
}

.dx-stage__curtain {
  z-index: 5;
  top: 0;
  bottom: 0;
  width: 56%;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent),
    color-mix(in srgb, var(--stage-accent) 70%, white);
  opacity: .88;
  animation: dx-curtain 940ms var(--aoi-ease-out) both;
}

.dx-stage__curtain--left {
  left: 0;
  clip-path: polygon(0 0, 84% 0, 100% 100%, 0 100%);
}

.dx-stage__curtain--right {
  right: 0;
  clip-path: polygon(16% 0, 100% 0, 100% 100%, 0 100%);
  animation-direction: reverse;
}

.dx-stage__ring {
  border: 2px solid rgba(255, 255, 255, 0.78);
  border-radius: var(--aoi-radius-round);
}

.dx-stage__ring--outer {
  right: 32px;
  bottom: 24px;
  width: 104px;
  height: 104px;
  box-shadow:
    0 0 0 10px rgba(255, 255, 255, 0.12),
    0 0 26px color-mix(in srgb, var(--stage-accent) 54%, transparent);
  animation: dx-ring 1.55s linear infinite;
}

.dx-stage__ring--inner {
  right: 62px;
  bottom: 54px;
  width: 44px;
  height: 44px;
  border-color: rgba(255, 255, 255, 0.52);
  animation: dx-ring 2.1s linear infinite reverse;
}

.dx-stage__halo {
  right: 18px;
  bottom: 10px;
  width: 134px;
  height: 134px;
  border-radius: var(--aoi-radius-round);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.36), transparent 64%);
  animation: dx-halo 1.4s var(--aoi-ease-out) infinite;
}

.dx-stage__sweep {
  inset: -40% auto auto 50%;
  z-index: 3;
  width: 118px;
  height: 180%;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.58), transparent);
  transform: rotate(26deg);
  transform-origin: center;
  animation: dx-sweep 1.9s var(--aoi-ease-out) infinite;
}

.dx-stage__track {
  left: 28px;
  width: 144px;
  height: 4px;
  border-radius: var(--aoi-radius-round);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 0 rgba(255, 255, 255, 0.48);
  animation: dx-track 1.4s var(--aoi-ease-out) both;
}

.dx-stage__track--top {
  top: 32px;
}

.dx-stage__track--middle {
  top: 84px;
  width: 196px;
  background: rgba(255, 255, 255, 0.42);
  transform: translateX(34px);
  animation-delay: 90ms;
}

.dx-stage__track--bottom {
  top: 144px;
  width: 118px;
  background: rgba(255, 255, 255, 0.36);
  transform: translateX(12px);
  animation-delay: 170ms;
}

.dx-stage__card {
  top: 58px;
  width: 96px;
  height: 66px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: var(--aoi-radius-sm);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), rgba(255, 255, 255, 0.22)),
    color-mix(in srgb, var(--stage-accent) 42%, white);
  box-shadow: 0 14px 26px rgba(23, 38, 43, 0.18);
  animation: dx-card 1.25s var(--aoi-ease-out) both;
}

.dx-stage__card--one {
  left: 35%;
}

.dx-stage__card--two {
  left: 50%;
  animation-delay: 120ms;
}

.dx-stage__card--three {
  left: 65%;
  animation-delay: 240ms;
}

.dx-stage__hit {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.86);
  border-radius: var(--aoi-radius-xs);
  background: color-mix(in srgb, var(--stage-accent) 54%, white);
  animation: dx-hit 1.3s var(--aoi-ease-out) infinite;
}

.dx-stage__hit--one {
  top: 78px;
  left: 52%;
}

.dx-stage__hit--two {
  top: 132px;
  left: 70%;
  animation-delay: 340ms;
}

.dx-stage__hit--three {
  top: 44px;
  left: 82%;
  animation-delay: 680ms;
}

.dx-stage__progress {
  right: 18px;
  bottom: 14px;
  left: 18px;
  height: 5px;
  overflow: hidden;
  border-radius: var(--aoi-radius-round);
  background: rgba(255, 255, 255, 0.24);
}

.dx-stage__progress::after {
  display: block;
  width: 42%;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.8);
  content: "";
  animation: dx-progress 1.7s linear infinite;
}

.dx-stage__readout {
  position: absolute;
  left: 18px;
  bottom: 18px;
  display: grid;
  min-width: 180px;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: var(--aoi-radius-sm);
  background: rgba(255, 255, 255, 0.78);
  color: var(--aoi-text);
  padding: 12px;
  backdrop-filter: blur(16px);
}

.dx-stage__readout span,
.dx-stage__readout small {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 750;
}

.dx-stage__readout strong {
  color: var(--aoi-accent-60);
  font-size: 22px;
  line-height: 1.1;
}

.dx-stage__meta {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.dx-stage__meta p {
  margin: 0;
}

.dx-stage__pulse {
  width: 10px;
  height: 34px;
  border-radius: var(--aoi-radius-round);
  background: var(--stage-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--stage-accent) 18%, transparent);
}

.dx-stage--select .dx-stage__screen {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 42%),
    linear-gradient(135deg, var(--aoi-sun-50), #65d5e4 54%, var(--aoi-secondary-50));
}

.dx-stage--result .dx-stage__screen {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 42%),
    linear-gradient(135deg, var(--aoi-sakura-50), #7a68f0 48%, #22b8cf);
}

@keyframes dx-ring {
  to {
    rotate: 360deg;
  }
}

@keyframes dx-screen-pop {
  from {
    filter: saturate(.72);
    transform: translateY(10px) scale(.965);
  }

  to {
    filter: saturate(1);
    transform: translateY(0) scale(1);
  }
}

@keyframes dx-curtain {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-120%);
  }
}

@keyframes dx-sweep {
  0%,
  8% {
    translate: -220px 0;
  }

  72%,
  100% {
    translate: 340px 0;
  }
}

@keyframes dx-track {
  from {
    clip-path: inset(0 100% 0 0);
    opacity: .2;
  }

  to {
    clip-path: inset(0);
    opacity: 1;
  }
}

@keyframes dx-card {
  from {
    opacity: 0;
    transform: translateX(120px) rotate(10deg) scale(.84);
  }

  to {
    opacity: .94;
    transform: translateX(0) rotate(-3deg) scale(1);
  }
}

@keyframes dx-halo {
  0%,
  100% {
    opacity: .45;
    transform: scale(.88);
  }

  50% {
    opacity: .9;
    transform: scale(1.08);
  }
}

@keyframes dx-hit {
  0%,
  100% {
    opacity: .55;
    transform: scale(.78);
  }

  45% {
    opacity: 1;
    transform: scale(1.16);
  }
}

@keyframes dx-progress {
  from {
    transform: translateX(-120%);
  }

  to {
    transform: translateX(260%);
  }
}

@media (max-width: 860px) {
  .dx-showcase {
    grid-template-columns: 1fr;
  }

  .dx-stage__screen {
    min-height: 190px;
  }
}

@media (max-width: 639px) {
  .dx-showcase {
    gap: 16px;
    padding: 14px;
  }

  .dx-showcase h2 {
    font-size: 20px;
  }

  .dx-showcase__modes {
    width: 100%;
  }

  .dx-stage__screen {
    min-height: 176px;
  }

  .dx-stage__readout {
    right: 14px;
    left: 14px;
    min-width: 0;
  }
}
</style>
