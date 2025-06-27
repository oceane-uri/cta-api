"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
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
exports.default = router;
