// BNY Multi-Sector Credit Income Fund (IE000LFUAKZ8)
// Factsheet e Commentary vêm do FE fundinfo (o mesmo serviço do fund centre da bny.com),
// em links fixos que sempre devolvem a versão mais recente, sem barreira de perfil.
const { baixar, textoPdf, mesNumero } = require('../lib/util');

const BASE = 'https://digital.feprecisionplus.com/documents/bnympeinstitutional/en-gb/BU5TG/';
const DOCS = { Factsheet: 'AD', Commentary: 'CM' };

module.exports = {
  nome: 'BNY',
  pasta: 'BNY Mellon\\BNY Multi-Sector Credit Income Fund\\Institucional',
  async coletar() {
    const out = [];
    for (const [tipo, codigo] of Object.entries(DOCS)) {
      const buf = await baixar(BASE + codigo);
      const m = (await textoPdf(buf, 1)).match(/AS AT\s+\d{1,2}\s+([A-Z]+)\s+(\d{4})/i);
      if (!m) throw new Error(`mês de referência não encontrado (${tipo})`);
      const mes = m[2] + mesNumero(m[1]);
      out.push({ mes, arquivo: `${mes} - BNY Multi-Sector Credit Income Fund-${tipo}.pdf`, buf });
    }
    return out;
  },
};
