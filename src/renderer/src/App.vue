<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface AppInfo {
  name: string;
  version: string;
  electron: string;
  chrome: string;
  node: string;
  platform: string;
  arch: string;
}

const info = ref<AppInfo | null>(null);
const loading = ref(false);

async function loadInfo(): Promise<void> {
  loading.value = true;
  try {
    info.value = await window.api.getInfo();
  } finally {
    loading.value = false;
  }
}

onMounted(loadInfo);
</script>

<template>
  <main class="wrap">
    <header>
      <h1>Electron + Vite + Vue</h1>
      <p class="subtitle">Built with electron-forge and pnpm.</p>
    </header>

    <section>
      <button type="button" :disabled="loading" @click="loadInfo">
        Refresh info
      </button>

      <ul v-if="info" class="info">
        <li v-for="(value, key) in info" :key="key">
          <span class="k">{{ key }}</span>
          <span class="v">{{ value }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
}

h1 {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.subtitle {
  margin: 0 0 32px;
  color: var(--muted);
  font-size: 14px;
}

button {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--fg);
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

button:hover:not(:disabled) {
  border-color: var(--accent);
}

button:active:not(:disabled) {
  background: #1f2330;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

.info {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.info li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  font-size: 14px;
}

.info li:first-child {
  border-top: none;
}

.k {
  color: var(--muted);
}

.v {
  color: var(--fg);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
