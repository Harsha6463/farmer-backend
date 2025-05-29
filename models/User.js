import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['farmer', 'investor', 'admin'],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profilePic: {
    type: String,
    default: '',
    required:true
  },
  mobileNumber: {
    type: String,
    required: true, 
    unique: true,  
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('User', userSchema);
