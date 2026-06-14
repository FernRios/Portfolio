<script setup lang="ts">
import { reactive, ref } from 'vue';
import { sendContact } from '../api';

const form = reactive({ name: '', email: '', message: '' });
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle');
const note = ref('');

async function submit() {
  status.value = 'sending';
  note.value = '';
  try {
    const res = await sendContact({ ...form });
    status.value = 'sent';
    note.value = res.delivered
      ? "Got it — I'll be in touch."
      : 'Got it. (Email delivery is off in this environment, so this was logged server-side.)';
    form.name = '';
    form.email = '';
    form.message = '';
  } catch (err) {
    status.value = 'error';
    note.value = err instanceof Error ? err.message : 'Something went wrong.';
  }
}
</script>

<template>
  <form class="contact" @submit.prevent="submit">
    <div class="row">
      <label class="field">
        <span class="label">Name</span>
        <input v-model.trim="form.name" type="text" required autocomplete="name" />
      </label>
      <label class="field">
        <span class="label">Email</span>
        <input v-model.trim="form.email" type="email" required autocomplete="email" />
      </label>
    </div>
    <label class="field">
      <span class="label">Message</span>
      <textarea v-model.trim="form.message" rows="4" required></textarea>
    </label>

    <div class="actions">
      <button class="btn-accent" type="submit" :disabled="status === 'sending'">
        {{ status === 'sending' ? 'Sending&hellip;' : 'Send message' }}
      </button>
      <p
        v-if="note"
        class="note mono"
        :class="{ ok: status === 'sent', bad: status === 'error' }"
      >
        {{ note }}
      </p>
    </div>
  </form>
</template>

<style scoped>
.contact {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 620px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--faint);
}
input,
textarea {
  font: inherit;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 0.7rem 0.85rem;
  resize: vertical;
  transition: border-color 0.15s var(--ease);
}
input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
}
.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.btn-accent:disabled {
  opacity: 0.6;
  cursor: progress;
}
.note {
  margin: 0;
  color: var(--muted);
}
.note.ok {
  color: var(--accent);
}
.note.bad {
  color: #d2503a;
}
@media (max-width: 540px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
