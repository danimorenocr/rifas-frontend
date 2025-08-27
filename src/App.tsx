import React, { useState, useRef, useEffect } from 'react';
import { Download, Users, Trophy, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Participant {
  name: string;
  numbers: number[];
  color: string;
}

const colors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#7C3AED'
];

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [occupiedNumbers, setOccupiedNumbers] = useState<Map<number, Participant>>(new Map());
  const tableRef = useRef<HTMLDivElement>(null);

  const API_URL = "http://localhost:4000"; // 👉 cámbialo cuando lo despliegues

  const generateNumbers = () => {
    const numbers = [];
    for (let i = 0; i < 1000; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const formatNumber = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  const getParticipantColor = (participantCount: number) => {
    return colors[participantCount % colors.length];
  };

  const handleNumberClick = (number: number) => {
    if (occupiedNumbers.has(number)) return;

    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < 3) {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  // 🔹 Fetch inicial de participantes desde backend
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_URL}/participants`);
      const data = await response.json();

      setParticipants(data);

      const newOccupied = new Map<number, Participant>();
      data.forEach((p: Participant, idx: number) => {
        const color = getParticipantColor(idx);
        p.color = color; // aseguramos que cada participante tenga color
        p.numbers.forEach((n: number) => newOccupied.set(n, p));
      });
      setOccupiedNumbers(newOccupied);
    } catch (error) {
      console.error("Error cargando participantes:", error);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  // 🔹 Guardar participante en backend
  const addParticipant = async () => {
    if (!currentName.trim() || selectedNumbers.length === 0) return;

    try {
      const response = await fetch(`${API_URL}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentName.trim(),
          numbers: selectedNumbers
        }),
      });

      if (response.ok) {
        await fetchParticipants();
        setCurrentName('');
        setSelectedNumbers([]);
      } else {
        const err = await response.json();
        alert("Error: " + err.error);
      }
    } catch (error) {
      console.error("Error agregando participante:", error);
    }
  };

  // 🔹 Reset desde backend
  const resetRifa = async () => {
    if (participants.length > 0 && !confirm('¿Estás seguro de que quieres reiniciar la rifa?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reset`, { method: "DELETE" });
      if (response.ok) {
        await fetchParticipants();
        setSelectedNumbers([]);
        setCurrentName('');
      }
    } catch (error) {
      console.error("Error reiniciando rifa:", error);
    }
  };

  const exportToImage = async () => {
    if (!tableRef.current) return;

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `rifa-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar la imagen. Inténtalo de nuevo.');
    }
  };

  const getNumberStyle = (number: number) => {
    if (selectedNumbers.includes(number)) {
      return 'bg-blue-500 text-white border-blue-600';
    }

    const participant = occupiedNumbers.get(number);
    if (participant) {
      return `text-white border-2`;
    }

    return 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700';
  };

  const numbers = generateNumbers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-800">Sistema de Rifas</h1>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-lg text-gray-600">1000 números disponibles (000-999) • Máximo 3 números por persona</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Participantes</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{participants.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-green-500">
            <span className="text-sm text-gray-600">Números Vendidos</span>
            <p className="text-2xl font-bold text-gray-800">{occupiedNumbers.size}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-yellow-500">
            <span className="text-sm text-gray-600">Disponibles</span>
            <p className="text-2xl font-bold text-gray-800">{1000 - occupiedNumbers.size}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-500">
            <span className="text-sm text-gray-600">Progreso</span>
            <p className="text-2xl font-bold text-gray-800">{Math.round((occupiedNumbers.size / 1000) * 100)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-lg sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Participante</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del participante
                  </label>
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Números seleccionados ({selectedNumbers.length}/3)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedNumbers.map(number => (
                      <span
                        key={number}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {formatNumber(number)}
                      </span>
                    ))}
                  </div>
                  {selectedNumbers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">Haz clic en los números de la tabla para seleccionar</p>
                  )}
                </div>

                <button
                  onClick={addParticipant}
                  disabled={!currentName.trim() || selectedNumbers.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                >
                  Agregar Participante
                </button>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={exportToImage}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Imagen
                </button>
                <button
                  onClick={resetRifa}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar Rifa
                </button>
              </div>

              {/* Participants List */}
              {participants.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Participantes</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {participants.map((participant, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: participant.color }}
                          ></div>
                          <span className="font-medium text-gray-800">{participant.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {participant.numbers.map(number => (
                            <span key={number} className="text-xs bg-white px-2 py-1 rounded">
                              {formatNumber(number)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="lg:col-span-3">
            <div ref={tableRef} className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Tabla de Números</h2>
                <p className="text-sm text-gray-600">Haz clic en los números disponibles para seleccionar</p>
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
                {numbers.map(number => {
                  const participant = occupiedNumbers.get(number);
                  return (
                    <button
                      key={number}
                      onClick={() => handleNumberClick(number)}
                      disabled={occupiedNumbers.has(number)}
                      className={`
                        aspect-square text-xs font-medium border-2 rounded-md transition-all duration-200 transform hover:scale-105
                        ${getNumberStyle(number)}
                        ${occupiedNumbers.has(number) ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      style={participant ? { backgroundColor: participant.color } : {}}
                      title={participant ? `${formatNumber(number)} - ${participant.name}` : `Número ${formatNumber(number)}`}
                    >
                      {formatNumber(number)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded"></div>
                  <span>Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 border-2 border-gray-500 rounded"></div>
                  <span>Ocupado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
