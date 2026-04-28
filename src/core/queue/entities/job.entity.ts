import * as mongoose from 'mongoose';

export const JobSchema = new mongoose.Schema({
  jobId: String,
  userId: String,
  queueName: String,
  jobName: String,
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  finishedAt: {
    type: Date,
    default: null,
  },
});
