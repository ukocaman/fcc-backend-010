const mongoose =require('mongoose')

const Schema = mongoose.Schema

const replySchema = new Schema({
  thread: { type: Schema.Types.ObjectId, ref: 'Thread' }, // belongs to one thread!
  text: String,
  delete_password: String,
  reported: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_on' } })

module.exports = mongoose.model('Reply', replySchema)
