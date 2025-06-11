import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const Expenses = () => {
  return (
    <Box 
      p={3} 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="80vh"
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2,
          maxWidth: 400,
          textAlign: 'center'
        }}
      >
        <ConstructionIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Under Maintenance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is currently being updated. Please check back later.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Expenses;
