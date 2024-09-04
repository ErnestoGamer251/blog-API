// index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY'; // Es recomendable usar variables de entorno para secretos

app.use(cors());
app.use(express.json());

// Registro de usuario
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword },
        });
        res.json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(400).json({ error: 'User registration failed', details: error.message });
    }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
});

// Middleware de autenticación
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.userId;
        next();
    });
};

// Rutas para posts (protegidas)
app.post('/posts', authenticate, async (req, res) => {
    const { title, content, published } = req.body;
    try {
        const post = await prisma.post.create({
            data: { title, content, published, authorId: req.userId },
        });
        res.json({ message: 'Post created successfully', post });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create post', details: error.message });
    }
});

// Obtener posts publicados (público)
app.get('/posts', async (req, res) => {
    const posts = await prisma.post.findMany({
        where: { published: true },
        include: { author: { select: { username: true } }, comments: { include: { author: { select: { username: true } } } } },
    });
    res.json(posts);
});

// Rutas para comentarios (protegidas)
app.post('/posts/:postId/comments', authenticate, async (req, res) => {
    const { content } = req.body;
    const { postId } = req.params;
    try {
        const comment = await prisma.comment.create({
            data: { content, postId: parseInt(postId), authorId: req.userId },
        });
        res.json({ message: 'Comment added successfully', comment });
    } catch (error) {
        res.status(400).json({ error: 'Failed to add comment', details: error.message });
    }
});

// Rutas de administración (protegidas)
app.get('/admin/posts', authenticate, async (req, res) => {
    const posts = await prisma.post.findMany({
        include: { author: true, comments: true },
    });
    res.json(posts);
});

app.put('/admin/posts/:postId', authenticate, async (req, res) => {
    const { postId } = req.params;
    const { published } = req.body;
    try {
        const updatedPost = await prisma.post.update({
            where: { id: parseInt(postId) },
            data: { published },
        });
        res.json({ message: 'Post updated successfully', updatedPost });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update post', details: error.message });
    }
});

app.delete('/admin/posts/:postId', authenticate, async (req, res) => {
    const { postId } = req.params;
    try {
        await prisma.post.delete({ where: { id: parseInt(postId) } });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete post', details: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
