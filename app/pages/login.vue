<script setup lang="ts">
const email = ref("")
const password = ref("")
const submitted = ref(false)

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length >= 6)

function submitLogin() {
  if (!canSubmit.value) {
    return
  }

  submitted.value = true
}

useHead({
  title: "登录 - Aoi"
})
</script>

<template>
  <div class="aoi-page auth-page">
    <section class="auth-shell" aria-labelledby="login-title">
      <AuthMotionVisual title="Login" />

      <form class="auth-panel" @submit.prevent="submitLogin">
        <p class="auth-panel__eyebrow">Aoi Account</p>
        <h1 id="login-title">登录 Aoi</h1>
        <p class="auth-panel__description">
          这里先做前端演示登录，不会请求后端，也不会写入账号数据。
        </p>

        <div class="auth-panel__fields">
          <AoiTextField
            v-model="email"
            label="邮箱"
            placeholder="rin@example.com"
            type="email"
            variant="outlined"
            @enter="submitLogin"
          />
          <AoiTextField
            v-model="password"
            label="密码"
            supporting-text="至少 6 位即可触发演示状态"
            type="password"
            variant="outlined"
            @enter="submitLogin"
          />
        </div>

        <AoiButton
          icon="log-in"
          type="button"
          :disabled="!canSubmit"
          @click="submitLogin"
        >
          登录
        </AoiButton>

        <p v-if="submitted" class="auth-panel__success">
          已进入演示登录状态，后续接入 Go API 时可替换为真实鉴权。
        </p>

        <p class="auth-panel__url-demo">
          <span>示例地址</span>
          <AoiLink to="https://www.iqwq.com/login" external target="_blank" />
        </p>

        <div class="auth-panel__switch">
          <span>还没有账号？</span>
          <AoiLink to="/register">去注册</AoiLink>
        </div>
      </form>
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
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr);
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
.auth-panel__url-demo,
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

.auth-panel__url-demo {
  display: grid;
  gap: 4px;
}

.auth-panel__url-demo span {
  font-size: 12px;
  font-weight: 800;
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
