# Lista de Compras com Reconhecimento por IA

Esta é a versão atualizada do aplicativo Lista de Compras com suporte para reconhecimento de produtos por foto usando Inteligência Artificial.

## 🆕 Novidades

- ✅ Botão "Foto com IA" para reconhecer produtos por foto
- ✅ Preview da foto carregada
- ✅ Estrutura pronta para integração com APIs de IA
- ✅ Código organizado para facilitar melhorias

## 📋 Como Funciona

1. **Tirar Foto**: Clique em "Foto com IA" e tire uma foto do produto
2. **Processar**: A foto é enviada para processamento (requer backend configurado)
3. **Preencher**: Os campos são preenchidos automaticamente com nome, código e categoria

## 🔧 Configuração Necessária

### Opção 1: Usar Backend (Recomendado)

Para usar reconhecimento por IA, você precisa criar um backend que fará a chamada à API. Isso é necessário por segurança (para não expor a API key no frontend).

#### Passo 1: Criar Backend

Exemplo com Node.js/Express:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Configure no .env
});

app.post('/api/reconhecer-produto', async (req, res) => {
  try {
    const { imagem } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise esta imagem de um produto de supermercado. Retorne um JSON com: nome (nome do produto), codigo (código de barras se visível), categoria (Mercado, Açougue, Limpeza, Higiene, Padaria, Bebidas, ou Outros). Seja preciso e retorne apenas o JSON."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imagem}`
            }
          }
        ]
      }]
    });
    
    const resultado = JSON.parse(response.choices[0].message.content);
    res.json(resultado);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar imagem' });
  }
});

app.listen(3000, () => {
  console.log('Backend rodando na porta 3000');
});
```

#### Passo 2: Configurar no Frontend

No arquivo `main.js`, linha ~609, configure a URL do seu backend:

```javascript
const API_BACKEND_URL = 'http://localhost:3000/api/reconhecer-produto'; // ou sua URL de produção
```

Descomente o código que faz a chamada ao backend (linhas ~627-638).

### Opção 2: API Direta (Não Recomendado - Apenas para Testes)

⚠️ **ATENÇÃO**: Não use em produção! API keys não devem ficar no código do frontend.

Se quiser testar diretamente (não recomendado):

1. Configure a API key no código (não recomendado)
2. Descomente o código que faz chamada direta
3. Configure CORS no servidor da API

## 📚 APIs de IA Disponíveis

### OpenAI GPT-4 Vision
- Site: https://platform.openai.com/
- Modelo: `gpt-4-vision-preview`
- Custo: Pago por uso

### Google Cloud Vision API
- Site: https://cloud.google.com/vision
- Funcionalidade: Reconhecimento de texto e objetos
- Custo: Pago por uso

### AWS Rekognition
- Site: https://aws.amazon.com/rekognition/
- Funcionalidade: Reconhecimento de objetos
- Custo: Pago por uso

## 🔄 Melhorias Futuras

Para melhorar o sistema, você pode:

1. **Melhorar o Prompt**: Ajustar o prompt para a API de IA reconhecer melhor produtos brasileiros
2. **Validação**: Adicionar validação dos dados retornados
3. **Fallback**: Implementar fallback quando a IA não reconhecer o produto
4. **Cache**: Cachear resultados para produtos similares
5. **Edição**: Permitir editar os campos antes de cadastrar
6. **Múltiplas Fotos**: Suportar múltiplas fotos do mesmo produto

## 📝 Estrutura do Código

- `processarFotoComIA()`: Função principal que processa a foto
- `preencherCamposComDadosIA()`: Preenche os campos com dados da IA
- `mostrarPreviewImagem()`: Mostra preview da foto
- `fileToBase64()`: Converte arquivo para base64

## 🚀 Deploy

1. Configure seu backend
2. Atualize `API_BACKEND_URL` no código
3. Teste localmente
4. Faça deploy do backend
5. Atualize URL para produção
6. Faça deploy do frontend

## 📞 Suporte

Para dúvidas sobre implementação, consulte a documentação das APIs escolhidas ou ajuste conforme suas necessidades.
