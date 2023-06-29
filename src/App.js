import logo from './logo.svg';
import './App.css';
import { Container, Typography, Box } from '@mui/material';
import Remote from './Remote.js';
function App() {
  return (
    <Container maxWidth="sm">
      <Box display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh">

        <Remote />

      </Box>
    </Container>
  );
}

export default App;
