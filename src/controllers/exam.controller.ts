import { Request, Response } from "express";
import { Exam } from "../models/exam.model";
import { ExamApplication } from "../models/exam-application.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";

export class ExamController {
  // Get all active exams
  static async getAllExams(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, difficulty, examType } = req.query;

      const filter: any = { isActive: true };
      if (difficulty) filter.difficulty = difficulty;
      if (examType) filter.examType = examType;

      const exams = await Exam.find(filter)
        .sort({ examDate: 1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit))
        .lean();
        console.log("exams", exams);

      const total = await Exam.countDocuments(filter);

      res.json({
        success: true,
        data: {
          exams,
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError("Failed to fetch exams", 500);
    }
  }

  // Get exam by ID
  static async getExamById(req: Request, res: Response) {
    try {
      const { examId } = req.params;

      const exam = await Exam.findById(examId).lean();
      if (!exam || !exam.isActive) {
        return res.status(404).json({
          success: false,
          message: "Exam not found",
          error: { code: "404", message: "Exam not found" }
        });
      }

      res.json({
        success: true,
        data: exam,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch exam details",
        error: { code: "500", message: "Failed to fetch exam details" }
      });
    }
  }

  // Apply for exam
  static async applyForExam(req: Request, res: Response) {
    try {
      const { examId } = req.params;
      const userId = req.user?._id;
      const { agreedToTerms } = req.body;

      if (!agreedToTerms) {
        return res.status(400).json({
          success: false,
          message: "You must agree to terms and conditions",
          error: { code: "400", message: "You must agree to terms and conditions" }
        });
      }

      // Check if exam exists and is active
      const exam = await Exam.findById(examId);
      if (!exam || !exam.isActive) {
        return res.status(404).json({
          success: false,
          message: "Exam not found or inactive",
          error: { code: "404", message: "Exam not found or inactive" }
        });
      }

      // Check if user already applied
      const existingApplication = await ExamApplication.findOne({
        examId,
        userId,
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: "You have already applied for this exam",
          error: { code: "400", message: "You have already applied for this exam" }
        });
      }

      // Create application
      const application = new ExamApplication({
        examId,
        userId,
        agreedToTerms,
        paymentStatus: "pending",
      });

      await application.save();

      // Update students applied count
      await Exam.findByIdAndUpdate(examId, {
        $inc: { studentsApplied: 1 },
      });

      res.status(201).json({
        success: true,
        data: {
          applicationId: application._id,
          paymentUrl: `/payment/${application._id}`,
          message: "Application submitted successfully",
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to apply for exam",
        error: { code: "500", message: "Failed to apply for exam" }
      });
    }
  }

  // Get user's exam applications
  static async getUserApplications(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { status } = req.query;

      const filter: any = { userId };
      if (status) filter.status = status;

      const applications = await ExamApplication.find(filter)
        .populate(
          "examId",
          "name tagline examDate duration entryPrice difficulty",
        )
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      throw new AppError("Failed to fetch applications", 500);
    }
  }

  // Check if user applied for specific exam
  static async checkApplicationStatus(req: Request, res: Response) {
    try {
      const { examId } = req.params;
      const userId = req.user?._id;

      const application = await ExamApplication.findOne({
        examId,
        userId,
      }).lean();

      res.json({
        success: true,
        data: {
          hasApplied: !!application,
          application: application || null,
        },
      });
    } catch (error) {
      throw new AppError("Failed to check application status", 500);
    }
  }

  // Admin: Create exam
  static async createExam(req: Request, res: Response) {
    try {
      const examData = req.body;

      const exam = new Exam(examData);
      await exam.save();

      res.status(201).json({
        success: true,
        data: exam,
        message: "Exam created successfully",
      });
    } catch (error) {
      throw new AppError("Failed to create exam", 500);
    }
  }

  // Admin: Update exam
  static async updateExam(req: Request, res: Response) {
    try {
      const { examId } = req.params;
      const updateData = req.body;

      const exam = await Exam.findByIdAndUpdate(examId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!exam) {
        throw new AppError("Exam not found", 404);
      }

      res.json({
        success: true,
        data: exam,
        message: "Exam updated successfully",
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update exam", 500);
    }
  }

  // Admin: Delete exam
  static async deleteExam(req: Request, res: Response) {
    try {
      const { examId } = req.params;

      // Soft delete by setting isActive to false
      const exam = await Exam.findByIdAndUpdate(
        examId,
        { isActive: false },
        { new: true },
      );

      if (!exam) {
        throw new AppError("Exam not found", 404);
      }

      res.json({
        success: true,
        message: "Exam deleted successfully",
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete exam", 500);
    }
  }
}
