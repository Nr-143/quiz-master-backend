/**
 * Hint System Test Suite
 * Run: npm test -- hint.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock data
const testUser = {
    email: 'test@example.com',
    password: 'Test123!',
    credits: 50
};

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken: string;
let userId: string;

describe('Hint System - Production Tests', () => {
    
    beforeAll(async () => {
        // Login to get auth token
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const data = await response.json();
        authToken = data.data.token;
        userId = data.data.user.id;
    });

    describe('RULE 1: Quiz Fetch API', () => {
        it('should NOT include hint field in quiz response', async () => {
            const response = await fetch(`${API_URL}/quizzes?category=java&level=beginner`);
            const data = await response.json();
            
            expect(data.success).toBe(true);
            expect(data.data.questions).toBeDefined();
            
            // Verify NO hint field in any question
            data.data.questions.forEach((q: any) => {
                expect(q.hint).toBeUndefined();
                expect(q.id).toBeDefined();
                expect(q.question).toBeDefined();
                expect(q.options).toBeDefined();
            });
        });
    });

    describe('RULE 2 & 3: Hint Unlock API', () => {
        it('should unlock hint and deduct 5 credits', async () => {
            const response = await fetch(`${API_URL}/quizzes/unlock-hint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    quizId: 'java',
                    questionId: 'j1'
                })
            });
            
            const data = await response.json();
            
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.hint).toBeDefined();
            expect(data.data.creditsDeducted).toBe(5);
            expect(data.data.remainingCredits).toBe(45);
        });

        it('should NOT deduct credits for already unlocked hint', async () => {
            const response = await fetch(`${API_URL}/quizzes/unlock-hint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    quizId: 'java',
                    questionId: 'j1'
                })
            });
            
            const data = await response.json();
            
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.hint).toBeDefined();
            expect(data.data.creditsDeducted).toBe(0);
            expect(data.data.remainingCredits).toBe(45);
        });

        it('should require authentication', async () => {
            const response = await fetch(`${API_URL}/quizzes/unlock-hint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizId: 'java',
                    questionId: 'j1'
                })
            });
            
            expect(response.status).toBe(401);
        });
    });
});
