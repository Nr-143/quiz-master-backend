import mongoose from 'mongoose';
import { config } from '../config/env.config';
import { Exam } from '../models/exam.model';

const examData = [
  {
    name: 'Full Stack Developer Assessment',
    tagline: 'Test your complete web development skills',
    description: 'Comprehensive exam covering frontend, backend, and database technologies including React, Node.js, MongoDB, and system design principles.',
    entryPrice: 299,
    examDate: new Date('2025-02-15T10:00:00Z'),
    duration: 120,
    difficulty: 'medium',
    language: 'English',
    numberOfQuestions: 50,
    examType: 'mixed',
    passingCriteria: '70% or above',
    benefits: [
      'Industry-recognized certificate',
      'Detailed performance analysis',
      'Career guidance session',
      'Access to exclusive job opportunities',
      'LinkedIn skill verification'
    ],
    hasCertificate: true,
    hasRankCard: true,
    hasPerformanceAnalysis: true,
    conductedBy: 'TechCorp Solutions',
    studentsApplied: 1250,
    supportContact: 'support@techcorp.com'
  },
  {
    name: 'React Developer Certification',
    tagline: 'Master modern React development',
    description: 'Advanced React concepts including hooks, context, performance optimization, testing, and modern React patterns.',
    entryPrice: 199,
    examDate: new Date('2025-02-20T14:00:00Z'),
    duration: 90,
    difficulty: 'hard',
    language: 'English',
    numberOfQuestions: 40,
    examType: 'coding',
    passingCriteria: '75% or above',
    benefits: [
      'React specialist certificate',
      'Code review by experts',
      'Portfolio project feedback',
      'React community access'
    ],
    hasCertificate: true,
    hasRankCard: false,
    hasPerformanceAnalysis: true,
    conductedBy: 'React Academy',
    studentsApplied: 890,
    supportContact: 'help@reactacademy.com'
  },
  {
    name: 'JavaScript Fundamentals',
    tagline: 'Prove your JavaScript expertise',
    description: 'Core JavaScript concepts, ES6+ features, async programming, DOM manipulation, and modern JavaScript best practices.',
    entryPrice: 149,
    examDate: new Date('2025-02-25T09:00:00Z'),
    duration: 75,
    difficulty: 'easy',
    language: 'English',
    numberOfQuestions: 35,
    examType: 'mcq',
    passingCriteria: '65% or above',
    benefits: [
      'JavaScript proficiency certificate',
      'Skill assessment report',
      'Learning path recommendations'
    ],
    hasCertificate: true,
    hasRankCard: true,
    hasPerformanceAnalysis: true,
    conductedBy: 'JS Masters',
    studentsApplied: 2100,
    supportContact: 'support@jsmasters.com'
  },
  {
    name: 'Node.js Backend Developer',
    tagline: 'Backend development with Node.js',
    description: 'Server-side development with Node.js, Express.js, database integration, API design, authentication, and deployment.',
    entryPrice: 249,
    examDate: new Date('2025-03-01T11:00:00Z'),
    duration: 100,
    difficulty: 'medium',
    language: 'English',
    numberOfQuestions: 45,
    examType: 'mixed',
    passingCriteria: '70% or above',
    benefits: [
      'Node.js developer certificate',
      'Backend architecture review',
      'Performance optimization tips',
      'Industry networking opportunities'
    ],
    hasCertificate: true,
    hasRankCard: true,
    hasPerformanceAnalysis: true,
    conductedBy: 'Backend Pro',
    studentsApplied: 756,
    supportContact: 'contact@backendpro.com'
  },
  {
    name: 'Python Data Science Certification',
    tagline: 'Data science with Python',
    description: 'Python for data analysis, machine learning, pandas, numpy, scikit-learn, and data visualization techniques.',
    entryPrice: 349,
    examDate: new Date('2025-03-05T13:00:00Z'),
    duration: 150,
    difficulty: 'hard',
    language: 'English',
    numberOfQuestions: 60,
    examType: 'coding',
    passingCriteria: '75% or above',
    benefits: [
      'Data science specialist certificate',
      'Project portfolio review',
      'Industry mentor connection',
      'Job placement assistance'
    ],
    hasCertificate: true,
    hasRankCard: true,
    hasPerformanceAnalysis: true,
    conductedBy: 'DataScience Institute',
    studentsApplied: 543,
    supportContact: 'info@datascienceinstitute.com'
  }
];

async function seedExams() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing exams
    await Exam.deleteMany({});
    console.log('Cleared existing exams');

    // Insert new exams
    const exams = await Exam.insertMany(examData);
    console.log(`Inserted ${exams.length} exams`);

    console.log('Exam seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding exams:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedExams();
}

export { seedExams };