import { useEffect, useState } from 'react';
import api from './services/api';
import './App.css';

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar os jogos da API quando o componente carregar
  useEffect(() => {
    api.get('/games')
      .then(response => {
        setGames(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar jogos:", err);
        setError("Não foi possível carregar os jogos. Verifique se a API está rodando.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando catálogo de jogos...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎮 Meu Catálogo de Jogos</h1>
      <p>Total de jogos cadastrados: <strong>{games.length}</strong></p>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Título</th>
            <th>Ano</th>
            <th>Plataforma</th>
            <th>Onde Jogou</th>
            <th>Status</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id}>
              <td>{game.title}</td>
              <td>{game.releaseYear}</td>
              <td>{game.platform}</td>
              <td>{game.playedOn}</td>
              <td>{game.status}</td>
              <td>{game.rating ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;