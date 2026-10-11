// Reading order only. Choices, availability, and state changes remain shared.
// Supplemental context is available in native, keyboard-accessible details.
export function readingOrder(state, page, historicalNotes) {
  const p = page.paragraphs;
  const info = [...(page.info || [])];
  let paragraphs = p;
  switch (state.node) {
    case 'C01':
      paragraphs = [p[0], p[1], p[2], p[3], p[4], p[9]];
      info.push(['Who will do the work at home?', [p[5], p[6]].join(' ')],
        ['Clouds, strangers, and Zeus', [p[7], p[8]].join(' ')]);
      // The short request and the full scope of consent stay above the choices.
      break;
    case 'C02':
      paragraphs = ["Timôn is preparing a gathering at Zeus's altar. The donor has already given the animal.", ...p.slice(1, 5)];
      info.push(['At the altar', 'Timôn holds a shallow bowl; nothing has been poured yet. ' + p[5]]);
      break;
    case 'C02.meal': {
      paragraphs = p.map(text => text.replace(' The rite takes place after the moment shown in the painting; no violence is described.', ''));
      info.push(['The painting and the rite', 'The rite takes place after the moment shown in the painting; no violence is described.']);
      break;
    }
    case 'C04':
      // All conflicting witnesses remain visible. Only the repeated caveat moves.
      paragraphs = p.filter((_, i) => i !== 7);
      info.push(['What you can honestly report', p[7]]);
      break;
    case 'C05.meeting':
      paragraphs = p.filter((_, i) => i !== 1);
      info.push(['Timôn on promises and rain', p[1]]);
      if (state.c04 === 'DEFENDER') {
        const speechIndex = paragraphs.findIndex(text => text.startsWith('Níkanor:'));
        if (speechIndex >= 0) {
          info.push(['The reading you argued for', paragraphs[speechIndex]]);
          paragraphs = paragraphs.filter((_, i) => i !== speechIndex);
        }
      }
      break;
  }
  return { ...page, paragraphs, ...(info.length ? { info } : {}) };
}
