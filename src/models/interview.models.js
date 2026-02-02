import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  interviewDate: {
    type: Date,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true,
    index: true
  },
  transcriptText: {
    type: String,
    default: ''
  },
  overall_communication_score: {
    type: Number,
    min: 0,
    max: 10
  },
  interviewer_name: {
    type: String,
    default: null
  },
  interviewee_name: {
    type: String,
    default: null
  },
  summary: {
    verdict: String,
    strengths: [String],
    primary_issues: [String]
  },
  speech_metrics: {
    words_per_minute: mongoose.Schema.Types.Mixed,
    pause_analysis: {
      long_pauses_detected: mongoose.Schema.Types.Mixed,
      average_pause_duration_seconds: mongoose.Schema.Types.Mixed
    },
    filler_words: {
      total_count: Number,
      fillers_per_minute: Number,
      most_common_fillers: [String]
    },
    repetition: {
      repeated_words_detected: Boolean,
      examples: [String]
    }
  },
  language_quality: {
    grammar_score: Number,
    clarity_score: Number,
    fluency_score: Number,
    incorrect_or_awkward_phrases: [String]
  },
  communication_skills: {
    confidence_score: Number,
    structure_score: Number,
    relevance_score: Number,
    engagement_score: Number
  },
  coaching_feedback: {
    what_went_well: [String],
    what_to_improve: [String],
    actionable_tips: [String]
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'scored', 'reviewed'],
    default: 'pending'
  },
  assemblyai_transcript_id: {
    type: String,
    default: null
  },
  assemblyai_analysis: {
    analysis: String,
    confidence: Number,
    source: String
  },
  assemblyai_insights: {
    insights: String,
    source: String
  }
}, {
  timestamps: true
});

export const Interview = mongoose.model('Interview', interviewSchema);