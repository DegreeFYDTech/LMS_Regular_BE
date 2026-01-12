import { exec } from 'child_process';
import { Router } from 'express';
import path from 'path';

const app = Router();

app.post('/webhook', (req, res) => {
  const scriptPath = path.resolve('auto_deploy/deploy.sh');
  exec(`sh ${scriptPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr || err);
      return res.status(500).json({ error: 'Deployment failed', details: stderr || err.message });
    }
    console.log(stdout);
    res.sendStatus(200);
  });
});

export default app;
