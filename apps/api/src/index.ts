const express = require("express");
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(5000, () => console.log('서버 실행: http://localhost:5000'));
