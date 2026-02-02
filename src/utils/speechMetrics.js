const generateSpeechMetrics = (data) => {
  const totalWords = data.words ? data.words.length : 0;
  // AssemblyAI audio_duration is in seconds, convert to minutes
  const durationMinutes = (data.audio_duration || 0) / 60;
  const wordsPerMinute =
    durationMinutes > 0 ? Math.round(totalWords / durationMinutes) : 0;


  // Count filler words
  const fillerWords = [
    "um",
    "uh",
    "like",
    "you know",
    "so",
    "basically",
    "actually",
  ];
  let fillerCount = 0;
  const fillerExamples = [];

  if (data.words) {
    data.words.forEach((word) => {
      if (fillerWords.includes(word.text.toLowerCase())) {
        fillerCount++;
        if (fillerExamples.length < 5)
          fillerExamples.push(word.text.toLowerCase());
      }
    });
  }

  // Detect repetitions
  const repetitions = [];
  if (data.words && data.words.length > 1) {
    for (let i = 0; i < data.words.length - 1; i++) {
      if (
        data.words[i].text.toLowerCase() ===
        data.words[i + 1].text.toLowerCase()
      ) {
        repetitions.push(data.words[i].text.toLowerCase());
      }
    }
  }

  return {
    words_per_minute: wordsPerMinute || 0,
    pause_analysis: {
      long_pauses_detected: false,
      average_pause_duration_seconds: 0,
    },
    filler_words: {
      total_count: fillerCount || 0,
      fillers_per_minute:
        durationMinutes > 0 ? Math.round(fillerCount / durationMinutes) : 0,
      most_common_fillers: [...new Set(fillerExamples)],
    },
    repetition: {
      repeated_words_detected: repetitions.length > 0,
      examples: [...new Set(repetitions)].slice(0, 5),
    },
  };
};

export { generateSpeechMetrics };