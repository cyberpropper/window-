const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');         // 🔹 для sessionId
require('dotenv').config();

const app = express();

// читаем настройки из .env
const ADMIN_LOGIN = (process.env.ADMIN_LOGIN || '').trim();
const ADMIN_PASS_HASH = (process.env.ADMIN_PASS_HASH || '').trim();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const PORT = process.env.PORT || 4000;

// 🔹 здесь будем хранить текущую активную сессию
let currentSessionId = null;

// лог запросов (для отладки)
app.use((req, res, next) => {
  console.log('-->', req.method, req.url);
  next();
});

app.use(express.json());
app.use(cookieParser());

// статика
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 логин с проверкой хэша и созданием sessionId
app.post('/api/login', async (req, res) => {
  const { login, pass } = req.body || {};
  console.log('LOGIN TRY body =', req.body);

  if (!login || !pass) {
    return res.status(400).json({ error: 'Укажите логин и пароль' });
  }

  if (login.trim() !== ADMIN_LOGIN) {
    console.log('LOGIN FAIL: wrong login');
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  try {
    const ok = await bcrypt.compare(String(pass), ADMIN_PASS_HASH);
    if (!ok) {
      console.log('LOGIN FAIL: wrong password');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
  } catch (e) {
    console.error('BCRYPT ERROR:', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }

  console.log('LOGIN OK');

  // 🔹 генерим новый sessionId и запоминаем его как единственный активный
  const sessionId = crypto.randomBytes(16).toString('hex');
  currentSessionId = sessionId;

  const token = jwt.sign(
    { user: ADMIN_LOGIN, sid: sessionId }, // вшиваем sid в JWT
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.cookie('sid', token, {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: 8 * 3600 * 1000,
  });

  res.json({ ok: true });
});

// 🔐 middleware: проверка JWT + актуальности sessionId
function authMiddleware(req, res, next) {
  const token = req.cookies.sid;
  if (!token) {
    return res.status(401).json({ error: 'Нет авторизации' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET); // { user, sid }

    // если кто-то залогинился позже — старые sid становятся неактуальными
    if (!payload.sid || payload.sid !== currentSessionId) {
      console.log('AUTH FAIL: outdated session', {
        tokenSid: payload.sid,
        currentSessionId
      });
      return res.status(401).json({ error: 'Сессия устарела. Выполните вход ещё раз.' });
    }

    req.user = payload;
    next();
  } catch (e) {
    console.log('AUTH ERROR:', e.message);
    return res.status(401).json({ error: 'Нет авторизации' });
  }
}

// пример защищённого эндпоинта: статус сессии
app.get('/api/status', authMiddleware, (req, res) => {
  res.json({
    ok: true,
    user: req.user.user,
  });
});

// всё остальное — index.html (важно: Express 5 → '/*', а не '*')
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
