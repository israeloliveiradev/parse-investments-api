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

  // 1) Separar linhas que começam com "|"
  const lines = markdown
    .split('\n')
    .filter(line => line.trim().startsWith('|'));

  // 2) Encontrar cabeçalho da tabela (linha que contém "Connector")
  const headerLine = lines.find(line => line.includes('Connector'));
  if (!headerLine) {
    res.status(400).json({ error: 'Tabela não encontrada no markdown' });
    return;
  }

  // 3) Extrair array de colunas do cabeçalho
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);

  // 4) Filtrar linhas de dados (removendo header e linha de separador)
  const dataLines = lines
    .filter(line => line !== headerLine)
    .filter(line => !/^\s*\|[-\s]+\|/.test(line));

  // 5) Montar array de objetos com id, conector e cobertura
  const resultados = dataLines.map(line => {
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    // Ex.: "Itaú (601)" → "Itaú"
    const nomeConector = cells[0].replace(/\s*\(\d+\)/, '');

    const cobertura = {};
    for (let i = 1; i < headers.length; i++) {
      const chave = headers[i];
      cobertura[chave] = cells[i].trim() === '🟢'
        ? 'ACTIVE'
        : 'INACTIVE';
    }

    return {
      id: uuidv4(),
      conector: nomeConector,
      cobertura
    };
  });

  res.status(200).json(resultados);
}
