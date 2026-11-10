import axios from 'axios';

// Altere a porta caso sua API C# esteja rodando em outra porta (ex: 5000 ou 5183)
const api = axios.create({
  baseURL: 'http://localhost:5040/api', // Substitua pela porta correta do seu backend .NET
});

export default api;