<script setup lang="ts">
import type { TournamentSummary } from '~/types/tournament'

const tournaments = ref<TournamentSummary[]>([])
const loading = ref(true)

async function fetchTournaments() {
  loading.value = true
  try {
    tournaments.value = await $fetch<TournamentSummary[]>('/api/tournament/list')
  }
  catch {
    tournaments.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchTournaments)

const active = computed(() => tournaments.value.filter(t => t.status === 'in_progress'))
const upcoming = computed(() => tournaments.value.filter(t => t.status === 'created'))
const completed = computed(() => tournaments.value.filter(t => t.status === 'completed'))
</script>

<template>
  <AuthGate feature="Tournaments" description="Sign in to create and join tournaments with brackets, standings, and live scores.">
    <div class="flex flex-col items-center gap-xl px-lg py-2xl max-w-[700px] mx-auto w-full max-sm:px-md max-sm:py-xl">
      <div class="flex items-center justify-between w-full">
        <h2 class="text-[1.8rem] font-black text-fg max-sm:text-[1.4rem]">
          Tournaments
        </h2>
        <NuxtLink to="/tournaments/new" class="btn btn-gold">
          + Create
        </NuxtLink>
      </div>

      <div v-if="loading" class="flex justify-center py-2xl w-full">
        <span class="text-fg-muted text-sm">Loading...</span>
      </div>

      <template v-else>
        <div v-if="tournaments.length === 0" class="glass-card w-full p-2xl text-center">
          <p class="text-fg-muted text-[0.9rem] mb-md">
            No tournaments yet
          </p>
          <NuxtLink to="/tournaments/new" class="btn btn-gold">
            Create Your First Tournament
          </NuxtLink>
        </div>

        <!-- Active tournaments -->
        <div v-if="active.length > 0" class="w-full flex flex-col gap-md">
          <span class="text-[0.75rem] font-semibold text-green uppercase tracking-widest">In Progress</span>
          <TournamentCard
            v-for="t in active"
            :key="t.id"
            v-bind="t"
          />
        </div>

        <!-- Upcoming tournaments -->
        <div v-if="upcoming.length > 0" class="w-full flex flex-col gap-md">
          <span class="text-[0.75rem] font-semibold text-gold uppercase tracking-widest">Upcoming</span>
          <TournamentCard
            v-for="t in upcoming"
            :key="t.id"
            v-bind="t"
          />
        </div>

        <!-- Completed tournaments -->
        <div v-if="completed.length > 0" class="w-full flex flex-col gap-md">
          <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Completed</span>
          <TournamentCard
            v-for="t in completed"
            :key="t.id"
            v-bind="t"
          />
        </div>
      </template>
    </div>
  </AuthGate>
</template>
