import moment from "moment";
import ErrorHandler from "../middlewares/error.js";
import { Interview } from "../models/interviewSchema.js";

export const validateInterviewTime = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const interview = await Interview.findOne({ applicationId });
    if (!interview) {
      return next(new ErrorHandler("Interview not found.", 404));
    }

    const scheduledDateTime = moment(
      `${interview.interviewDate} ${interview.interviewTime}`,
      "YYYY-MM-DD HH:mm"
    );
    const currentDateTime = moment();

    if (currentDateTime.isBefore(scheduledDateTime)) {
      return next(
        new ErrorHandler(
          "The interview can only be accessed after the scheduled time.",
          400
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default  validateInterviewTime;