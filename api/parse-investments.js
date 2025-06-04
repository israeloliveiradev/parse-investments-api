// arquivo: /api/parse-investments.js
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  const { markdown } = req.body || {};
  if (!markdown) {
    res.status(400).json({ error: 'Campo "markdown" ausente' });
    return;
  }

  // 1) pega só as linhas da tabela
  const lines = markdown
    .split('\n')
    .filter(line => line.trim().startsWith('|'));

  // 2) encontra cabeçalho (linha do “Connector”)
  const headerLine = lines.find(line => line.includes('Connector'));
  if (!headerLine) {
    res.status(400).json({ error: 'Tabela não encontrada no markdown' });
    return;
  }

  // 3) extrai colunas do header
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);

  // 4) filtra só as linhas de dados (não header e nem separador)
  const dataLines = lines
    .filter(line => line !== headerLine)
    .filter(line => !/^\s*\|[-\s]+\|/.test(line));

  // 5) monta o array final
  const resultados = dataLines.map(line => {
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    // ex: "Itaú (601)" → "Itaú"
    const nomeConector = cells[0].replace(/\s*\(\d+\)/, '');

    // primeiro, monta objeto coberturaObj[chaveEmInglês] = "ACTIVE"/"INACTIVE"
    const coberturaObj = {};
    for (let i = 1; i < headers.length; i++) {
      const chave = headers[i];
      coberturaObj[chave] = cells[i].trim() === '🟢' ? 'ACTIVE' : 'INACTIVE';
    }

    // depois transforma em array de { key, value }
    const coberturaArray = Object.entries(coberturaObj).map(
      ([key, value]) => ({ key, value })
    );

    return {
      id: uuidv4(),
      conector: nomeConector,
      coberturaCollection: coberturaArray
    };
  });

  res.status(200).json(resultados);
}
