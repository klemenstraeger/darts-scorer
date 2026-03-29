<script setup lang="ts">
import type { TournamentMatch } from '~/types/tournament'

const props = defineProps<{
  matches: TournamentMatch[]
  showPlayButton?: boolean
}>()

const emit = defineEmits<{
  play: [matchId: number]
}>()

const { getAvatarProps } = usePlayers()

// Organize matches by round
const rounds = computed(() => {
  const map = new Map<number, TournamentMatch[]>()
  for (const match of props.matches) {
    if (!map.has(match.round))
      map.set(match.round, [])
    map.get(match.round)!.push(match)
  }

  for (const [, matches] of map) {
    matches.sort((a, b) => a.position - b.position)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, matches]) => ({ round, matches }))
})

const totalRounds = computed(() => rounds.value.length)

// Group matches into pairs per round so we can draw bracket connector lines.
// Each pair of adjacent matches feeds one match in the next round.
const groupedRounds = computed(() => {
  return rounds.value.map((r, idx) => {
    const isLast = idx === rounds.value.length - 1
    const pairs: TournamentMatch[][] = []
    for (let i = 0; i < r.matches.length; i += 2) {
      const pair: TournamentMatch[] = [r.matches[i]!]
      if (r.matches[i + 1])
        pair.push(r.matches[i + 1]!)
      pairs.push(pair)
    }
    return { ...r, pairs, isLast }
  })
})

function roundLabel(round: number): string {
  const fromFinal = totalRounds.value - round + 1
  if (fromFinal === 1)
    return 'Final'
  if (fromFinal === 2)
    return 'Semi-Finals'
  if (fromFinal === 3)
    return 'Quarter-Finals'
  return `Round ${round}`
}
</script>

<template>
  <div class="overflow-x-auto pb-md">
    <div class="flex gap-xl min-w-max p-md">
      <div
        v-for="r in groupedRounds"
        :key="r.round"
        class="flex flex-col gap-md min-w-[200px]"
      >
        <div class="text-[0.7rem] font-bold text-fg-muted uppercase tracking-[1px] text-center pb-xs border-b-2 border-black">
          {{ roundLabel(r.round) }}
        </div>

        <div class="flex flex-col flex-1">
          <div
            v-for="pair in r.pairs"
            :key="pair[0]!.id"
            class="flex flex-col flex-1 relative"
            :class="{ 'bracket-pair': !r.isLast && pair.length === 2 }"
          >
            <div v-for="match in pair" :key="match.id" class="flex flex-col justify-center flex-1 py-sm">
              <div class="ko-bracket-match">
                <div
                  class="ko-bracket-slot"
                  :class="{
                    'ko-bracket-winner': match.winnerName === match.player1Name,
                    'ko-bracket-inprogress': match.status === 'in_progress',
                  }"
                >
                  <span class="flex items-center gap-1 text-[0.75rem] font-semibold text-fg-secondary whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]" :class="{ 'text-fg font-bold': match.winnerName === match.player1Name }">
                    <PlayerAvatar v-if="match.player1Name" v-bind="getAvatarProps(match.player1Name)" :size="16" />{{ match.player1Name || 'TBD' }}
                  </span>
                  <span v-if="match.status === 'completed'" class="text-[0.75rem] font-extrabold text-fg tabular-nums">{{ match.player1LegsWon }}</span>
                </div>
                <div
                  class="ko-bracket-slot"
                  :class="{
                    'ko-bracket-winner': match.winnerName === match.player2Name,
                    'ko-bracket-inprogress': match.status === 'in_progress',
                  }"
                >
                  <span class="flex items-center gap-1 text-[0.75rem] font-semibold text-fg-secondary whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]" :class="{ 'text-fg font-bold': match.winnerName === match.player2Name }">
                    <PlayerAvatar v-if="match.player2Name" v-bind="getAvatarProps(match.player2Name)" :size="16" />{{ match.player2Name || 'TBD' }}
                  </span>
                  <span v-if="match.status === 'completed'" class="text-[0.75rem] font-extrabold text-fg tabular-nums">{{ match.player2LegsWon }}</span>
                </div>
                <button
                  v-if="match.status === 'pending' && match.player1Name && match.player2Name && showPlayButton"
                  class="ko-bracket-play-btn"
                  @click="emit('play', match.id)"
                >
                  Play
                </button>
                <span v-if="match.status === 'in_progress'" class="ko-bracket-live" style="animation: pulse-opacity 1.5s ease-in-out infinite;">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* KnockoutBracket — non-scoped for adjacent sibling + absolute positioning with complex transforms.
   All classes prefixed with ko-bracket- to namespace. */

.ko-bracket-match {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  border: 2px solid black;
  border-radius: var(--radius-sm);
  box-shadow: 2px 2px 0 black;
}

.ko-bracket-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  min-height: 28px;
}

.ko-bracket-slot + .ko-bracket-slot {
  border-top: 2px solid black;
}

.ko-bracket-winner {
  background: var(--yellow-light);
}

.ko-bracket-inprogress {
  border-left: 3px solid var(--yellow);
}

/* Bracket connector: the ⊏ shape connecting a pair of matches to the next round.
   With two flex-1 match wrappers inside a flex-1 pair, the match centers land
   exactly at 25% and 75% of the pair height — so top: 25%; height: 50% is precise. */
.bracket-pair {
  position: relative;
}

.bracket-pair::after {
  content: '';
  position: absolute;
  right: calc(-1 * var(--spacing-xl));
  width: var(--spacing-xl);
  top: 25%;
  height: 50%;
  border-top: 2px solid black;
  border-right: 2px solid black;
  border-bottom: 2px solid black;
  pointer-events: none;
  z-index: 1;
}

.ko-bracket-play-btn {
  position: absolute;
  top: 50%;
  right: -4px;
  transform: translateY(-50%) translateX(100%);
  padding: 2px var(--spacing-sm);
  background: var(--yellow);
  color: black;
  border: 2px solid black;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 2px 2px 0 black;
}

.ko-bracket-play-btn:hover {
  transform: translateY(-50%) translateX(100%) translate(-2px, -2px);
  box-shadow: 4px 4px 0 black;
}

.ko-bracket-live {
  position: absolute;
  top: 50%;
  right: -4px;
  transform: translateY(-50%) translateX(100%);
  padding: 2px var(--spacing-sm);
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--yellow);
  z-index: 2;
}
</style>
