import { Inject, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { JobDoc } from 'src/core/queue/interfaces/job.interface';
import { GetJobsLogInterface } from './interfaces/jobs.interface';

@Injectable()
export class JobService {
  constructor(@Inject('JOB_MODEL') private jobModel: Model<JobDoc>) {}

  async getJobsLog(getJobsLogInterface: GetJobsLogInterface) {
    if (getJobsLogInterface.useCursorPagination) {
      const filter = {
        userId: getJobsLogInterface.userId,
        $or: [] as object[],
      };

      // will be executed on page 2 and beyond
      if (getJobsLogInterface.cursor) {
        const { createdAt, _id } = getJobsLogInterface.cursor;
        filter.$or.push(
          { createdAt: { $lt: new Date(createdAt) } },
          {
            createdAt: new Date(createdAt),
            _id: { $lt: new mongoose.Types.ObjectId(_id) },
          },
        );
      }

      // executed on page 1
      const jobs = await this.jobModel
        .find(filter)
        .sort({
          createdAt: 'desc',
          _id: 'desc',
        })
        .limit(getJobsLogInterface.limit + 1)
        .lean();

      const hasNext = jobs.length > getJobsLogInterface.limit;
      if (hasNext) jobs.pop();

      const lastDoc = jobs[jobs.length - 1];

      return {
        data: jobs,
        nextCursor: hasNext
          ? { createdAt: lastDoc.createdAt, _id: lastDoc._id.toString() }
          : null,
      };
    }

    // executes offset-based pagination by default
    return await this.jobModel
      .find({
        userId: getJobsLogInterface.userId,
      })
      .sort({
        createdAt: 'desc',
      })
      .skip((Number(getJobsLogInterface.page) - 1) * getJobsLogInterface.limit)
      .limit(getJobsLogInterface.limit)
      .exec();
  }
}
