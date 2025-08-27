const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware CORS mais permissivo
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500', // Live Server do VSCode
    'https://sistema-pedidos-api-front.vercel.app', // SEU FRONTEND NO VERCEL
    'https://*.vercel.app' // Todos os subdomínios Vercel
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Conexão com MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-pedidos';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar com MongoDB:', err));

// Schema e Model
const pedidoSchema = new mongoose.Schema({
  cliente: { type: String, required: true },
  valor: { type: Number, required: true },
  data: { type: String, required: true },
  empresa: { type: String, required: true },
}, { timestamps: true });

const Pedido = mongoose.model('Pedido', pedidoSchema);

// Rotas
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando' });
});

// Obter todos os pedidos
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Criar novo pedido
app.post('/pedidos', async (req, res) => {
  try {
    const { cliente, valor, data, empresa } = req.body;
    
    const novoPedido = new Pedido({
      cliente,
      valor,
      data,
      empresa
    });
    
    const pedidoSalvo = await novoPedido.save();
    res.status(201).json(pedidoSalvo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar pedido
app.put('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente, valor, data, empresa } = req.body;
    
    const pedidoAtualizado = await Pedido.findByIdAndUpdate(
      id,
      { cliente, valor, data, empresa },
      { new: true, runValidators: true }
    );
    
    if (!pedidoAtualizado) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    res.json(pedidoAtualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Excluir pedido
app.delete('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoExcluido = await Pedido.findByIdAndDelete(id);
    
    if (!pedidoExcluido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    res.json({ message: 'Pedido excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ message: 'API do Sistema de Pedidos' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});