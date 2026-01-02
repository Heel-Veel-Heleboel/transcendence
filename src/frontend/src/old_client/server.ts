import express, { request, response } from 'express';
import path from 'path';
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to serve static files from the client
const __dirname = process.cwd();

app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// Serve client-side app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
