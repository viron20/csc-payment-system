const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    academic_year: { type: String, required: true },
    semester: { type: String, enum: ['1st', '2nd'], default: '1st' },
    status: { type: String, enum: ['paid', 'not_paid'], default: 'not_paid' },
    receipt: { type: String, default: null },
    uploaded_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

paymentSchema.index({ user_id: 1, academic_year: 1, semester: 1 }, { unique: true });
paymentSchema.index({ user_id: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
