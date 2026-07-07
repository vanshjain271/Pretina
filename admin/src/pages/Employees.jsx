import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Chip, Button, TextField, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel,
  Checkbox, CircularProgress, IconButton, Tooltip, Stack, InputAdornment,
  Switch,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import SearchIcon      from '@mui/icons-material/Search';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, toggleEmployeeStatus } from '../api/endpoints';

const ALL_PERMISSIONS = [
  { key: 'products.view', label: 'View Products' },
  { key: 'products.manage', label: 'Manage Products' },
  { key: 'orders.view', label: 'View Orders' },
  { key: 'orders.manage', label: 'Manage Orders' },
  { key: 'invoices.view', label: 'View Invoices' },
  { key: 'customers.view', label: 'View Customers' },
  { key: 'customers.manage', label: 'Manage Customers' },
  { key: 'reports.view', label: 'View Reports' },
  { key: 'coupons.view', label: 'View Coupons' },
  { key: 'coupons.manage', label: 'Manage Coupons' },
  { key: 'brands.view', label: 'View Brands' },
  { key: 'categories.view', label: 'View Categories' },
  { key: 'banners.view', label: 'View Banners' },
  { key: 'blog.view', label: 'View Blog' },
  { key: 'blog.manage', label: 'Manage Blog' },
  { key: 'activity.view', label: 'View Activity Log' },
];

const EMPTY_FORM = { name: '', phone: '', email: '', password: '', permissions: [] };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      setEmployees(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setDialogOpen(true); };
  const openEdit = (emp) => {
    setForm({ name: emp.name, phone: emp.phone, email: emp.email || '', password: '', permissions: emp.permissions || [] });
    setEditId(emp._id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await updateEmployee(editId, form);
      } else {
        await createEmployee(form);
      }
      setDialogOpen(false);
      fetchEmployees();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try { await deleteEmployee(id); fetchEmployees(); } catch (e) { console.error(e); }
  };

  const handleToggle = async (id) => {
    try { await toggleEmployeeStatus(id); fetchEmployees(); } catch (e) { console.error(e); }
  };

  const togglePermission = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.phone?.includes(search)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Employees</Typography>
          <Typography variant="body2" color="text.secondary">{employees.length} staff members</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Employee
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TextField
            placeholder="Search by name or phone…"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ mb: 2, width: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
          />

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, background: '#fafafa' } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No employees found</TableCell></TableRow>
                ) : filtered.map(emp => (
                  <TableRow key={emp._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1A1A2E', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                          {(emp.name || 'E')[0]}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13}>{emp.name}</Typography>
                          <Typography fontSize={11} color="text.secondary">{emp.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{emp.phone}</Typography></TableCell>
                    <TableCell>
                      <Typography fontSize={12} color="text.secondary">
                        {emp.permissions?.length || 0} permissions
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={emp.isActive}
                        onChange={() => handleToggle(emp._id)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{new Date(emp.createdAt).toLocaleDateString('en-IN')}</Typography></TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(emp)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(emp._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full Name" size="small" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required fullWidth />
            <TextField label="Phone" size="small" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required fullWidth />
            <TextField label="Email" size="small" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} fullWidth />
            <TextField label={editId ? 'New Password (leave blank to keep)' : 'Password'} type="password" size="small" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editId} fullWidth />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Permissions</Typography>
              <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {ALL_PERMISSIONS.map(p => (
                  <FormControlLabel
                    key={p.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={form.permissions.includes(p.key)}
                        onChange={() => togglePermission(p.key)}
                        color="primary"
                      />
                    }
                    label={<Typography fontSize={13}>{p.label}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : editId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
