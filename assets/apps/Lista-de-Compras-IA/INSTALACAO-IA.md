# 📸 Instalação e Configuração do Reconhecimento por IA

Este guia explica como configurar o reconhecimento de produtos por foto usando Inteligência Artificial.

## 📋 Pré-requisitos

1. Uma conta em uma plataforma de IA (OpenAI, Google Cloud, AWS, etc.)
2. API key da plataforma escolhida
3. Um servidor backend (Node.js, Python, PHP, etc.) para fazer as chamadas

## 🚀 Opção 1: Backend Node.js com OpenAI (Recomendado)

### Passo 1: Criar Backend

Crie um novo projeto Node.js:

```bash
mkdir backend-ia
cd backend-ia
npm init -y
npm install express cors openai dotenv
```

### Passo 2: Criar arquivo `server.js`

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/reconhecer-produto', async (req, res) => {
  try {
    const { imagem } = req.body;
    
    if (!imagem) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise esta imagem de um produto de supermercado brasileiro. Identifique o nome do produto, código de barras (se visível) e categoria. Retorne APENAS um JSON válido no formato: {\"nome\": \"nome do produto\", \"codigo\": \"código de barras ou vazio\", \"categoria\": \"Mercado|Açougue|Limpeza|Higiene|Padaria|Bebidas|Outros\"}. Seja preciso e retorne apenas o JSON, sem explicações."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imagem}`,
              detail: "high"
            }
          }
        ]
      }],
      max_tokens: 300
    });
    
    const conteudo = response.choices[0].message.content.trim();
    // Limpar possíveis markdown code blocks
    const jsonLimpo = conteudo.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const resultado = JSON.parse(jsonLimpo);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar imagem: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

### Passo 3: Criar arquivo `.env`

```
OPENAI_API_KEY=sua-api-key-aqui
PORT=3000
```

### Passo 4: Configurar no Frontend

No arquivo `main.js`, linha ~610, configure:

```javascript
const API_BACKEND_URL = 'http://localhost:3000/api/reconhecer-produto'; // Local
// ou
const API_BACKEND_URL = 'https://seu-dominio.com/api/reconhecer-produto'; // Produção
```

Descomente o código da OPÇÃO 1 (linhas ~627-638).

### Passo 5: Testar

1. Inicie o backend: `node server.js`
2. Abra o app no navegador
3. Clique em "Foto com IA"
4. Tire uma foto de um produto
5. Veja os campos sendo preenchidos automaticamente!

## 🔧 Opção 2: Simulação (Para Desenvolvimento)

Se quiser testar sem configurar a API ainda:

1. No arquivo `main.js`, descomente a OPÇÃO 2 (linhas ~641-650)
2. O sistema simulará uma resposta após 2 segundos
3. Útil para testar a interface sem custos de API

## 🌐 Deploy do Backend

### Heroku
```bash
heroku create seu-app-ia
heroku config:set OPENAI_API_KEY=sua-key
git push heroku main
```

### Vercel (Serverless)
Crie um arquivo `api/reconhecer-produto.js` e use o exemplo acima como função serverless.

### Outras Plataformas
Qualquer plataforma que suporte Node.js funciona (AWS, Google Cloud, DigitalOcean, etc.)

## 💡 Melhorias Sugeridas

Você pode melhorar o sistema:

1. **Melhorar o Prompt**: Ajustar para reconhecer melhor produtos brasileiros
2. **Validação**: Validar dados antes de preencher campos
3. **Cache**: Cachear resultados para produtos similares
4. **Múltiplas APIs**: Usar fallback entre diferentes APIs
5. **Confiança**: Adicionar score de confiança da IA
6. **Correção Manual**: Permitir editar campos antes de cadastrar

## 📝 Notas Importantes

- ⚠️ NUNCA coloque API keys no código do frontend
- ✅ Sempre use um backend como proxy
- 💰 APIs de IA têm custo (consulte preços)
- 🔒 Proteja seu backend com autenticação se necessário
- 📊 Monitore uso da API para controlar custos

## 🆘 Problemas Comuns

### CORS Error
- Configure CORS no backend (já incluído no exemplo)
- Ou use proxy no servidor web

### Erro 401 (Não Autorizado)
- Verifique se a API key está correta
- Verifique se a key tem créditos/disponível

### Erro 429 (Rate Limit)
- Você atingiu o limite de requisições
- Aguarde ou aumente o limite na plataforma

### Resposta não é JSON válido
- Melhore o prompt para garantir resposta JSON
- Adicione validação e tratamento de erro
