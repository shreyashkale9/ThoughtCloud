const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  folder: { type: String }, // Optional: for folder/category organization
  tags: [{ type: String }], // Optional: for tags
  type: { type: String, enum: ['text', 'handwritten'], default: 'text' }, // Note type
  drawingData: { type: String }, // Canvas drawing data for handwritten notes
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);