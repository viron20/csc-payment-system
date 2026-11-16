const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true, trim: true },
    middlename: { type: String, default: '', trim: true },
    lastname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null }, // NULL for Google-only accounts
    course: { type: String, default: null },
    year_level: { type: Number, default: null },
    department: { type: String, default: null },
    role: { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student' },
    status: { type: String, enum: ['active', 'graduated'], default: 'active' },
    google_id: { type: String, default: null },
    avatar_url: { type: String, default: null },
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

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
