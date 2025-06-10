import { Router } from 'express';

const router = Router();

router.get('/globales', (req, res) => {
  res.json({
    totalVehicules: 12000,
    enRetard3mois: 2500,
    enRetard6mois: 1700,
    enRetard12mois: 950,
    enRetard18mois: 420,
    enRetard24plus: 310
  });
});

export default router;
