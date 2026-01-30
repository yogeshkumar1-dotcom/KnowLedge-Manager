function computeSpeechMetrics(words, fillers, durationSeconds) {
  const wordCount = words.length;
  const wpm = (wordCount / durationSeconds) * 60;

  const fillerCount = fillers.length;
  const fillersPerMinute = (fillerCount / durationSeconds) * 60;

  const pauses = [];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap > 1.5) pauses.push(gap);
  }

  return {
    words_per_minute: Math.round(wpm),
    filler_words: {
      total_count: fillerCount,
      fillers_per_minute: Number(fillersPerMinute.toFixed(1))
    },
    pause_analysis: {
      long_pauses_detected: pauses.length > 0,
      average_pause_duration_seconds:
        pauses.length ? Number((pauses.reduce((a,b)=>a+b,0)/pauses.length).toFixed(2)) : 0
    }
  };
}
export { computeSpeechMetrics };