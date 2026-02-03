import mongoose from 'mongoose';
import { config } from '../config/env.config';
import { Category } from '../models/category.model';

const categoryData = [
  {
    id: "java",
    name: "Java",
    icon: "coffee",
    description: "Master Java fundamentals, OOP, collections, and advanced concepts",
    premium: false,
    questionCount: 150,
    color: "#E76F00"
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: "file-code",
    description: "ES6+, async programming, DOM manipulation, and frameworks",
    premium: false,
    questionCount: 200,
    color: "#F7DF1E"
  },
  {
    id: "python",
    name: "Python",
    icon: "terminal",
    description: "Core Python, data structures, and popular libraries",
    premium: false,
    questionCount: 175,
    color: "#3776AB"
  },
  {
    id: "react",
    name: "React",
    icon: "atom",
    description: "Hooks, state management, performance optimization",
    premium: false,
    questionCount: 120,
    color: "#61DAFB"
  },
  {
    id: "nodejs",
    name: "Node.js",
    icon: "server",
    description: "Server-side JavaScript, Express, and API development",
    premium: false,
    questionCount: 100,
    color: "#339933"
  },
  {
    id: "sql",
    name: "SQL",
    icon: "database",
    description: "Database queries, optimization, and design patterns",
    premium: false,
    questionCount: 80,
    color: "#4479A1"
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: "file-type",
    description: "Type system, generics, and advanced patterns",
    premium: true,
    questionCount: 90,
    color: "#3178C6"
  },
  {
    id: "system-design",
    name: "System Design",
    icon: "network",
    description: "Scalability, architecture patterns, and distributed systems",
    premium: true,
    questionCount: 60,
    color: "#9333EA"
  },
  {
    id: "dsa",
    name: "Data Structures",
    icon: "binary",
    description: "Arrays, trees, graphs, and algorithm complexity",
    premium: false,
    questionCount: 180,
    color: "#DC2626"
  },
  {
    id: "devops",
    name: "DevOps",
    icon: "cloud",
    description: "CI/CD, Docker, Kubernetes, and cloud platforms",
    premium: true,
    questionCount: 70,
    color: "#0EA5E9"
  },
  {
    id: "aws",
    name: "AWS",
    icon: "cloud-cog",
    description: "Cloud services, solutions architecture, and best practices",
    premium: true,
    questionCount: 100,
    color: "#FF9900"
  },
  {
    id: "git",
    name: "Git & GitHub",
    icon: "git-branch",
    description: "Version control, branching strategies, and collaboration",
    premium: false,
    questionCount: 50,
    color: "#F05032"
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    console.log('Cleared existing categories');

    const categories = await Category.insertMany(categoryData);
    console.log(`Inserted ${categories.length} categories`);

    console.log('Category seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedCategories();
}

export { seedCategories };