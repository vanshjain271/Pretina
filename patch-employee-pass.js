const fs = require('fs');
const file = 'admin/src/pages/Employees.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('showPwd')) {
  content = content.replace('const [saving, setSaving] = useState(false);', "const [saving, setSaving] = useState(false);\n  const [showPwd, setShowPwd] = useState(false);");
  content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { InputAdornment, IconButton } from '@mui/material';\nimport { Visibility, VisibilityOff } from '@mui/icons-material';");
  
  const oldTextField = `<TextField label={editId ? 'New Password (leave blank to keep)' : 'Password'} type="password" size="small" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editId} fullWidth />`;
  const newTextField = `<TextField 
              label={editId ? 'New Password (leave blank to keep)' : 'Password'} 
              type={showPwd ? "text" : "password"} 
              size="small" 
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              required={!editId} 
              fullWidth 
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(!showPwd)} edge="end">
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />`;
  content = content.replace(oldTextField, newTextField);
  fs.writeFileSync(file, content);
  console.log('Patched!');
} else {
  console.log('Already patched.');
}
