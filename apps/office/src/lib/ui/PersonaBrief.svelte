<script lang="ts">
  import type { Offer } from '../persona.ts';

  let { offer }: { offer: Offer } = $props();
  const specialty = $derived(offer.remit.trim() || offer.role.trim());
</script>

<details class="text-start text-xs leading-relaxed">
  <summary class="cursor-pointer font-medium text-sea">What can I ask {offer.name}?</summary>
  {#if specialty && specialty !== offer.jobTitle}
    <p class="mt-2 whitespace-pre-line text-ink">{specialty}</p>
  {/if}
  <p class="mt-2 text-muted">
    To review a plan, share your goal, the options and the constraint you face. Ask, “Which
    assumption should I test before I choose, and why?”
  </p>
</details>
