<script setup lang="ts">
const displayName = ref("")
const email = ref("")
const password = ref("")
const submitted = ref(false)

const canSubmit = computed(() => {
  return displayName.value.trim().length >= 2
    && email.value.trim().length > 0
    && password.value.length >= 6
})

function submitRegister() {
  if (!canSubmit.value) {
    return
  }

  submitted.value = true
}

useHead({
  title: "注册 - Aoi"
})
</script>

<template>
  <div class="aoi-page auth-page">
    <section class="auth-shell" aria-labelledby="register-title">
      <form class="auth-panel" @submit.prevent="submitRegister">
        <p class="auth-panel__eyebrow">Aoi Account</p>
        <h1 id="register-title">创建账号</h1>
        <p class="auth-panel__description">
          先保留一个轻量注册入口，用来预览未来账号体系和跳转转场。
        </p>

        <div class="auth-panel__fields">
          <AoiTextField
            v-model="displayName"
            label="昵称"
            placeholder="Rin721"
            supporting-text="至少 2 个字符"
            variant="outlined"
            @enter="submitRegister"
          />
          <AoiTextField
            v-model="email"
            label="邮箱"
            placeholder="rin@example.com"
            type="email"
            variant="outlined"
            @enter="submitRegister"
          />
          <AoiTextField
            v-model="password"
            label="密码"
            supporting-text="至少 6 位即可触发演示状态"
            type="password"
            variant="outlined"
            @enter="submitRegister"
          />
        </div>

        <AoiButton
          icon="user-plus"
          type="button"
          :disabled="!canSubmit"
          @click="submitRegister"
        >
          注册
        </AoiButton>

        <p v-if="submitted" class="auth-panel__success">
          已创建演示账号。真实注册逻辑可以在接入后端鉴权接口后补齐。
        </p>

        <div class="auth-panel__switch">
          <span>已经有账号？</span>
          <AoiLink to="/login">去登录</AoiLink>
        </div>
      </form>

      <AuthMotionVisual title="Join" variant="register" />
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: calc(100vh - 36px);
  align-items: center;
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(320px, .95fr) minmax(0, 1.05fr);
  gap: 20px;
  align-items: stretch;
}

.auth-panel {
  display: grid;
  align-content: center;
  gap: 16px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-surface);
  box-shadow: var(--aoi-shadow-sm);
  padding: 24px;
}

.auth-panel__eyebrow,
.auth-panel__description,
.auth-panel__switch,
.auth-panel__success {
  margin: 0;
}

.auth-panel__eyebrow {
  color: var(--aoi-active-color);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.auth-panel h1 {
  margin: 0;
  color: var(--aoi-text);
  font-size: 30px;
  line-height: 1.2;
}

.auth-panel__description,
.auth-panel__switch {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.auth-panel__fields {
  display: grid;
  gap: 12px;
}

.auth-panel__success {
  border: 1px solid rgba(34, 184, 207, 0.22);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
  line-height: 1.7;
  padding: 10px 12px;
}

.auth-panel__switch {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.auth-panel__switch a {
  color: var(--aoi-accent-60);
  font-weight: 800;
}

@media (max-width: 860px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .auth-page {
    min-height: calc(100vh - var(--aoi-mobile-nav-height));
  }

  .auth-panel {
    padding: 18px;
  }

  .auth-panel h1 {
    font-size: 24px;
  }
}
</style>
