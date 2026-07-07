/**
 * Employee Controller — Pretina V2
 * Manages employee users (role='employee') — CRUD + permissions
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../services/activity.service');

// GET /api/v1/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: employees });
  } catch (err) {
    console.error('getEmployees:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/v1/employees
const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, password, permissions = [] } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const employee = await User.create({
      name,
      email: email || '',
      phone,
      password, // hashed by pre-save hook
      role: 'employee',
      permissions,
      createdBy: req.user._id,
      isActive: true,
    });

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'employee.created',
      description: `Created employee ${name} (${phone})`,
      entityType: 'employee',
      entityId: employee._id,
    });

    const { password: _, ...safeEmployee } = employee.toObject();
    return res.status(201).json({ success: true, data: safeEmployee });
  } catch (err) {
    console.error('createEmployee:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/v1/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, permissions, isActive, password } = req.body;

    const employee = await User.findOne({ _id: id, role: 'employee' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    if (name !== undefined) employee.name = name;
    if (email !== undefined) employee.email = email;
    if (permissions !== undefined) employee.permissions = permissions;
    if (isActive !== undefined) employee.isActive = isActive;
    if (password) employee.password = await bcrypt.hash(password, 12);

    await employee.save();

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'employee.updated',
      description: `Updated employee ${employee.name}`,
      entityType: 'employee',
      entityId: employee._id,
    });

    const { password: _, ...safe } = employee.toObject();
    return res.json({ success: true, data: safe });
  } catch (err) {
    console.error('updateEmployee:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/v1/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOneAndDelete({ _id: id, role: 'employee' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'employee.deleted',
      description: `Deleted employee ${employee.name}`,
      entityType: 'employee',
      entityId: employee._id,
    });

    return res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    console.error('deleteEmployee:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/v1/employees/:id/toggle
const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ _id: id, role: 'employee' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    employee.isActive = !employee.isActive;
    await employee.save();

    return res.json({ success: true, isActive: employee.isActive });
  } catch (err) {
    console.error('toggleEmployeeStatus:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee, toggleEmployeeStatus };
