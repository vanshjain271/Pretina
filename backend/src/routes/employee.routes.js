const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/employee.controller');

router.use(protect, adminOnly);

router.get('/', ctrl.getEmployees);
router.post('/', ctrl.createEmployee);
router.patch('/:id', ctrl.updateEmployee);
router.delete('/:id', ctrl.deleteEmployee);
router.patch('/:id/toggle', ctrl.toggleEmployeeStatus);

module.exports = router;
