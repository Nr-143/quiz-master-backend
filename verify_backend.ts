import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

async function verify() {
    try {
        console.log('1. Health Check');
        await axios.get('http://localhost:5000/health');
        console.log('✅ Server is healthy');

        console.log('2. Register User');
        const randomUser = `user_${Math.floor(Math.random() * 10000)}`;
        const email = `${randomUser}@example.com`;
        const password = 'password123';

        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            username: randomUser,
            email,
            password
        });
        const token = registerRes.data.data.accessToken;
        console.log('✅ Registered:', randomUser);

        console.log('3. Login User');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        console.log('✅ Logged in');

        console.log('4. Get Categories');
        const catRes = await axios.get(`${API_URL}/quizzes/categories`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Categories:', catRes.data.data.categories);

        console.log('5. Get Java Quiz');
        const quizRes = await axios.get(`${API_URL}/quizzes?category=Java`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const questions = quizRes.data.data.quiz.questions;
        console.log(`✅ Loaded ${questions.length} questions`);

        console.log('6. Submit Quiz');
        const answers = questions.map((q: any) => ({
            id: q.id,
            answer: q.options[0] // Just picking first option
        }));

        const submitRes = await axios.post(`${API_URL}/quizzes/submit`, {
            category: 'Java',
            answers
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Score:', submitRes.data.data.result.score);

        console.log('7. Get Leaderboard');
        const lbRes = await axios.get(`${API_URL}/scores/leaderboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Leaderboard count:', lbRes.data.data.leaderboard.length);

        console.log('8. Get User Stats');
        const statsRes = await axios.get(`${API_URL}/users/me/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ User Stats:', statsRes.data.data.stats);

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
    }
}

verify();
