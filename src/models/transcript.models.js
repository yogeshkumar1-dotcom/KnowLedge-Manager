import mongoose, { mongo } from "mongoose";

// const segmentSchema = new mongoose.Schema(
//   {
//     speaker: { type: String, default: null },
//     start: { type: Number },
//     end: { type: Number },
//     text: { type: String },
//   },
//   { _id: false }
// );

// const actionSchema = new mongoose.Schema(
//   {
//     text: { type: String, required: true },
//     suggestedAssigneeName: { type: String, default: null },
//     dueDate: { type: Date, default: null },
//     priority: {
//       type: String,
//       enum: ["Low", "Medium", "High"],
//       default: "Medium",
//     },
//     confidence: { type: Number, default: 0 }, // 0..1
//   },
//   { _id: false }
// );

// const transcriptSchema = new mongoose.Schema(
//   {
//     meetingCauptureId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "MeetingCapture",
//       required: true,
//       unique: true,
//     },
//     rawText: {
//       type: String,
//     },
//     segments: [segmentSchema],
//     participantsExtracted: [String], // names extracted from speech
//     provider: { type: String },
//     actions: [actionSchema],
//   },
//   { timestamps: true }
// );

const transcriptSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
    }, // who uploaded
    fileName: { type: String, required: true }, // Supabase file name
    transcriptText: { type: String, default: "" }, // result text
    transcriptTitle: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    notes: {
      summary: String,
      keyPoints: [String],
    },
    analytics: {
      consistency: { type: Number, default: 0 },
      replicacy: { type: Number, default: 0 },
      logicalThinking: { type: Number, default: 0 },
      relatableAnswers: { type: Number, default: 0 },
    },
    notesCreated: { type: Boolean, default: false },
    externalProvider: { type: String, default: "assemblyai" },
    externalId: { type: String }, // id from external provider
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

// const taskSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     transcriptId: { type: mongoose.Schema.Types.ObjectId, ref: "Transcript" },
//     assignedPersons: [
//         {
//             name: { type: String, required: true },
//             email: { type: String },
//             taskName: { type: String, required: true },
//             dueDate: { type: Date },
//             priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium"   } 
//         }
//     ]
//   },
//   { timestamps: true }
// );

const Transcript = mongoose.model("Transcript", transcriptSchema);

export { Transcript };
