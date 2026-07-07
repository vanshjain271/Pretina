import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Chip } from '@mui/material';
import { getAbandonedCarts } from '../api/endpoints';
export default function AbandonedCarts() {
  const [carts, setCarts] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await getAbandonedCarts(); setCarts(r.data.analytics?.carts || []); } catch(e){} finally{setLoading(false);} })(); }, []);
  return (<Box sx={{p:3}}><Typography variant="h5" fontWeight={700} mb={3}>Abandoned Carts</Typography><Card><CardContent>{loading ? <Box sx={{textAlign:'center',py:4}}><CircularProgress/></Box> : <Table size="small"><TableHead><TableRow sx={{'& th':{fontWeight:700,background:'#fafafa'}}}><TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell>Items</TableCell><TableCell>Last Active</TableCell></TableRow></TableHead><TableBody>{carts.length===0 ? <TableRow><TableCell colSpan={4} align="center" sx={{py:4,color:'text.secondary'}}>No abandoned carts</TableCell></TableRow> : carts.map(c=><TableRow key={c._id} hover><TableCell>{c.user?.name||'Guest'}</TableCell><TableCell>{c.user?.phone||'—'}</TableCell><TableCell>{c.items?.length||0} items</TableCell><TableCell>{new Date(c.updatedAt).toLocaleDateString('en-IN')}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></Box>);
}
