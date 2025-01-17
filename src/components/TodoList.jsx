import React, { useState } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  TextField,
  MenuItem,
  Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const categories = [
  'All',
  'Work',
  'Personal',
  'Shopping',
  'Health',
  'Other'
];

function TodoList({ todos }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const filteredTodos = todos.filter(todo => 
    selectedCategory === 'All' || todo.category === selectedCategory
  );

  console.log('All todos:', todos); // Debug log
  console.log('Selected category:', selectedCategory); // Debug log
  console.log('Filtered todos:', filteredTodos); // Debug log

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Todo List
      </Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          fullWidth
        >
          {categories.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <List>
        {filteredTodos && filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => (
            <ListItem key={todo.id} divider>
              <Checkbox
                checked={todo.completed || false}
              />
              <ListItemText
                primary={todo.title}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block' }}
                    >
                      Category: {todo.category}
                    </Typography>
                    {todo.description && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {todo.description}
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No todos found in this category
          </Typography>
        )}
      </List>
    </Paper>
  );
}

export default TodoList;