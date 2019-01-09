const mongoose =require('mongoose')

const Schema = mongoose.Schema

const threadSchema = new Schema({
  board: String,
  text: String,
  delete_password: String,
  reported: { type: Boolean, default: false },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }] // one to many relationship
}, { timestamps: { createdAt: 'created_on', updatedAt: 'bumped_on' } })

module.exports = mongoose.model('Thread', threadSchema)
