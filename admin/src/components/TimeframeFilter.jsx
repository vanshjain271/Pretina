import React, { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';

export default function TimeframeFilter({ value, onChange }) {
  const handleChange = (e) => {
    const selected = e.target.value;
    let startDate = null;
    let endDate = null;

    const now = dayjs();

    switch (selected) {
      case 'today':
        startDate = now.startOf('day').toISOString();
        endDate = now.endOf('day').toISOString();
        break;
      case 'yesterday':
        startDate = now.subtract(1, 'day').startOf('day').toISOString();
        endDate = now.subtract(1, 'day').endOf('day').toISOString();
        break;
      case 'this_week':
        startDate = now.startOf('week').toISOString();
        endDate = now.endOf('week').toISOString();
        break;
      case 'this_month':
        startDate = now.startOf('month').toISOString();
        endDate = now.endOf('month').toISOString();
        break;
      case 'last_6_months':
        startDate = now.subtract(6, 'month').startOf('month').toISOString();
        endDate = now.endOf('month').toISOString();
        break;
      case 'last_year':
        startDate = now.subtract(1, 'year').startOf('year').toISOString();
        endDate = now.subtract(1, 'year').endOf('year').toISOString();
        break;
      case 'all_time':
      default:
        startDate = null;
        endDate = null;
        break;
    }

    onChange({ timeframe: selected, startDate, endDate });
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id="timeframe-filter-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CalendarMonthIcon fontSize="small" /> Timeframe
      </InputLabel>
      <Select
        labelId="timeframe-filter-label"
        value={value || 'all_time'}
        label="Timeframe"
        onChange={handleChange}
        sx={{ borderRadius: 2 }}
      >
        <MenuItem value="all_time">All Time</MenuItem>
        <MenuItem value="today">Today</MenuItem>
        <MenuItem value="yesterday">Yesterday</MenuItem>
        <MenuItem value="this_week">This Week</MenuItem>
        <MenuItem value="this_month">This Month</MenuItem>
        <MenuItem value="last_6_months">Last 6 Months</MenuItem>
        <MenuItem value="last_year">Last Year</MenuItem>
      </Select>
    </FormControl>
  );
}
