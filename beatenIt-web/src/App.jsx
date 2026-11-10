import { useEffect, useState } from 'react';
import api from './services/api';
import './App.css';

const PLATFORMS = [
  "PlayStation 1", "PlayStation 2", "PlayStation 3", "PlayStation 4", "PlayStation 5", "PS Vita", "PSP",
  "Xbox", "Xbox 360", "Xbox One", "Xbox Series X/S",
  "Nintendo Switch", "Nintendo 3DS", "Wii U", "Wii", "GameCube", "Nintendo 64", "SNES", "NES", "Game Boy",
  "Windows", "Linux", "Android", "iOS", "Arcade"
];

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [originalGame, setOriginalGame] = useState(null); 

  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [platform, setPlatform] = useState('');
  const [playedOn, setPlayedOn] = useState('');
  const [ownership, setOwnership] = useState('0');
  const [status, setStatus] = useState('0');
  const [rating, setRating] = useState('');
  
  const [startedOn, setStartedOn] = useState('');
  const [finishedOn, setFinishedOn] = useState('');
  const [playtimeHours, setPlaytimeHours] = useState('');
  const [playtimeMinutes, setPlaytimeMinutes] = useState('');

  const fetchGames = () => {
    api.get('/games')
      .then(response => {
        setGames(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar jogos:", err);
        setError("Não foi possível carregar os jogos.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleEditClick = (game) => {
    setEditingId(game.id);
    setOriginalGame(game);

    setTitle(game.title || '');
    setReleaseYear(game.releaseYear ?? '');
    setPlatform(game.platform || '');
    setPlayedOn(game.playedOn || '');
    setOwnership(game.ownership !== undefined ? String(game.ownership) : '0');
    setStatus(game.status !== undefined ? String(game.status) : '0');
    setRating(game.rating !== null && game.rating !== undefined ? String(game.rating) : '');
    
    setStartedOn(game.startedOn ? game.startedOn.split('T')[0] : '');
    setFinishedOn(game.finishedOn ? game.finishedOn.split('T')[0] : '');

    if (game.totalPlayed) {
      const parts = game.totalPlayed.split(':');
      setPlaytimeHours(parts[0] ? parseInt(parts[0]) : '');
      setPlaytimeMinutes(parts[1] ? parseInt(parts[1]) : '');
    } else {
      setPlaytimeHours('');
      setPlaytimeMinutes('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setOriginalGame(null);
    setTitle('');
    setReleaseYear('');
    setPlatform('');
    setPlayedOn('');
    setOwnership('0');
    setStatus('0');
    setRating('');
    setStartedOn('');
    setFinishedOn('');
    setPlaytimeHours('');
    setPlaytimeMinutes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('O título é obrigatório!');

    if (startedOn && finishedOn) {
      if (new Date(startedOn) > new Date(finishedOn)) {
        return alert('⚠️ A data de início não pode ser posterior à data de término!');
      }
    }

    let formattedTimeSpan = null;
    if (playtimeHours !== '' || playtimeMinutes !== '') {
      const h = String(parseInt(playtimeHours) || 0).padStart(2, '0');
      const m = String(parseInt(playtimeMinutes) || 0).padStart(2, '0');
      formattedTimeSpan = `${h}:${m}:00`;
    }

    const gameData = {
      title: title.trim(),
      releaseYear: releaseYear !== '' ? parseInt(releaseYear) : (originalGame ? originalGame.releaseYear : null),
      platform: platform.trim() !== '' ? platform : (originalGame ? originalGame.platform : ''),
      playedOn: playedOn.trim() !== '' ? playedOn : (originalGame ? originalGame.playedOn : ''),
      ownership: ownership !== '' ? parseInt(ownership) : (originalGame ? originalGame.ownership : 0),
      status: status !== '' ? parseInt(status) : (originalGame ? originalGame.status : 0),
      rating: rating !== '' ? parseFloat(rating) : (originalGame ? originalGame.rating : null),
      startedOn: startedOn !== '' ? startedOn : (originalGame ? originalGame.startedOn : null),
      finishedOn: finishedOn !== '' ? finishedOn : (originalGame ? originalGame.finishedOn : null),
      totalPlayed: formattedTimeSpan !== null ? formattedTimeSpan : (originalGame ? originalGame.totalPlayed : null)
    };

    try {
      if (editingId) {
        await api.put(`/games/${editingId}`, gameData);
        alert('Jogo atualizado com sucesso!');
      } else {
        await api.post('/games', gameData);
        alert('Jogo cadastrado com sucesso!');
      }

      resetForm();
      fetchGames();
    } catch (err) {
      console.error("Erro ao salvar jogo:", err);
      alert('Erro ao salvar o jogo. Verifique o console.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este jogo?')) return;

    try {
      await api.delete(`/games/${id}`);
      alert('Jogo excluído com sucesso!');
      fetchGames();
    } catch (err) {
      console.error("Erro ao excluir jogo:", err);
      alert('Erro ao excluir o jogo.');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>Carregando catálogo...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ textAlign: 'center' }}>🎮 Meu Catálogo de Jogos</h1>
      <p style={{ textAlign: 'center' }}>Total de jogos cadastrados: <strong>{games.length}</strong></p>

      {/* Datalist global para plataformas e locais */}
      <datalist id="platforms-list">
        {PLATFORMS.map((plat, index) => (
          <option key={index} value={plat} />
        ))}
      </datalist>

      <form onSubmit={handleSubmit} style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', border: editingId ? '2px solid #ff9800' : '1px solid #333' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 10px 0', color: editingId ? '#ff9800' : '#4CAF50' }}>
            {editingId ? `Editando Jogo (ID: ${editingId})` : 'Adicionar Novo Jogo'}
          </h3>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Título *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Ano de Lançamento</label>
          <input type="number" value={releaseYear} onChange={e => setReleaseYear(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Plataforma</label>
          <input type="text" list="platforms-list" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Selecione ou digite..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Onde Jogou</label>
          <input type="text" list="platforms-list" value={playedOn} onChange={e => setPlayedOn(e.target.value)} placeholder="Selecione ou digite..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Posse (Ownership)</label>
          <select value={ownership} onChange={e => setOwnership(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}>
            <option value="0">Owned</option>
            <option value="1">Borrowed</option>
            <option value="2">Subscribed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}>
            <option value="0">Completed</option>
            <option value="1">Playing</option>
            <option value="2">Shelved</option>
            <option value="3">Dropped</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nota (Rating)</label>
          <input type="number" step="0.5" min="0" max="5" value={rating} onChange={e => setRating(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Iniciado em</label>
          <input type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Finalizado em</label>
          <input type="date" value={finishedOn} onChange={e => setFinishedOn(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Tempo Jogado (Horas / Minutos)</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input type="number" placeholder="Hrs" value={playtimeHours} onChange={e => setPlaytimeHours(e.target.value)} style={{ width: '50%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
            <input type="number" placeholder="Min" value={playtimeMinutes} onChange={e => setPlaytimeMinutes(e.target.value)} style={{ width: '50%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }} />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ background: '#777', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
          )}
          <button type="submit" style={{ background: editingId ? '#ff9800' : '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {editingId ? '💾 Salvar Alterações' : '➕ Adicionar Jogo'}
          </button>
        </div>
      </form>

      {/* Tabela de Jogos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: '#333', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>Título</th>
            <th style={{ padding: '12px' }}>Ano</th>
            <th style={{ padding: '12px' }}>Plataforma</th>
            <th style={{ padding: '12px' }}>Onde Jogou</th>
            <th style={{ padding: '12px' }}>Status</th>
            <th style={{ padding: '12px' }}>Nota</th>
            <th style={{ padding: '12px' }}>Início</th>
            <th style={{ padding: '12px' }}>Fim</th>
            <th style={{ padding: '12px' }}>Tempo</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '12px' }}>{game.title}</td>
              <td style={{ padding: '12px' }}>{game.releaseYear}</td>
              <td style={{ padding: '12px' }}>{game.platform}</td>
              <td style={{ padding: '12px' }}>{game.playedOn}</td>
              <td style={{ padding: '12px' }}>{game.status}</td>
              <td style={{ padding: '12px' }}>{game.rating ?? '-'}</td>
              <td style={{ padding: '12px' }}>{game.startedOn ? game.startedOn.split('T')[0] : '-'}</td>
              <td style={{ padding: '12px' }}>{game.finishedOn ? game.finishedOn.split('T')[0] : '-'}</td>
              <td style={{ padding: '12px' }}>{game.totalPlayed || '-'}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button onClick={() => handleEditClick(game)} style={{ background: '#2196F3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>
                  ✏️ Editar
                </button>
                <button onClick={() => handleDelete(game.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  🗑️ Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;