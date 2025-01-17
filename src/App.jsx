import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, Box } from '@mui/material';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const { ipcRenderer } = window.require('electron');

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const loadedTodos = await ipcRenderer.invoke('get-todos');
      console.log('Loaded todos:', loadedTodos); // Debug log
      setTodos(loadedTodos);
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const handleAddTodo = async (todoData) => {
    try {
      console.log('Adding todo:', todoData); // Debug log
      const newTodo = await ipcRenderer.invoke('create-todo', todoData);
      console.log('New todo created:', newTodo); // Debug log
      setTodos(prevTodos => [...prevTodos, newTodo]);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <TodoForm onAddTodo={handleAddTodo} />
          <Box sx={{ mt: 4 }}>
            <TodoList todos={todos} />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;