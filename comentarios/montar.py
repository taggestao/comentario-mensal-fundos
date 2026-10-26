"""Monta o Word do mês a partir do documento do mês anterior.

Uso:
  python3 montar.py BASE.docx comentarios_AAAAMM.py SAIDA.docx [--tabela RetornosCarteirasFoFs_AAAAMM.xlsx] [--mes Outubro]

- BASE.docx: documento do mês anterior (ou o rascunho do mês), da pasta de Materiais.
- comentarios_AAAAMM.py: define COMENTARIOS = {'TÍTULO DO FUNDO': ['parágrafo', ...], ...};
  o título é comparado com o início do título no documento (14 pt). Fundos fora do dicionário
  ficam como estão.
- --tabela: troca a imagem da tabela de resultados (primeira imagem do corpo) pela gerada do
  Excel da pasta "Resultados Offshore" (ver tabela_resultados.py).
- --mes: troca o nome do mês no cabeçalho (header1.xml, aparece 2 vezes). Em janeiro, conferir o ano.

A formatação (Calibri, cores, espaçamento) é copiada do primeiro parágrafo de corpo do documento.
Os parágrafos novos não levam w14:paraId/w14:textId: ids repetidos fazem o Word recusar o arquivo.
"""
import argparse
import html
import os
import re
import runpy
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tabela_resultados  # noqa: E402

MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto',
         'Setembro', 'Outubro', 'Novembro', 'Dezembro']
P = re.compile(r'<w:p[ >].*?</w:p>', re.S)
texto = lambda p: ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))
sem_ids = lambda p: re.sub(r' w14:(paraId|textId)="[0-9A-Fa-f]+"', '', p)
eh_titulo = lambda p: '<w:sz w:val="28"/>' in p and texto(p).strip()


def trocar_comentarios(xml, comentarios):
    paras = [(m.start(), m.end(), m.group()) for m in P.finditer(xml)]
    titulos = [i for i, p in enumerate(paras) if eh_titulo(p[2])]
    fim_doc = next(i for i, p in enumerate(paras) if texto(p[2]).startswith('Área de Gestão'))
    # modelo de formatação: primeiro parágrafo de corpo depois do primeiro título, e o espaçador seguinte
    i_corpo = next(i for i in range(titulos[0] + 1, len(paras)) if texto(paras[i][2]).strip())
    corpo = paras[i_corpo][2]
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', corpo, re.S).group()
    rpr = re.search(r'<w:r[ >].*?(<w:rPr>.*?</w:rPr>)', corpo, re.S).group(1)
    espaco = sem_ids(paras[i_corpo + 1][2])
    assert not texto(espaco).strip(), 'esperava parágrafo vazio após o corpo'
    novo_par = lambda t: f'<w:p>{ppr}<w:r>{rpr}<w:t xml:space="preserve">{html.escape(t, quote=False)}</w:t></w:r></w:p>'

    trocas = []
    for nome, textos in comentarios.items():
        achados = [i for i in titulos if texto(paras[i][2]).strip().upper().startswith(nome.strip().upper())]
        if not achados:
            sys.exit(f'título não encontrado no documento: {nome}')
        it = achados[0]
        prox = min([i for i in titulos if i > it] + [fim_doc])
        ini, fim = paras[it + 1][0], paras[prox][0]   # tudo entre o título e o próximo título
        seg = xml[ini:fim]
        assert '<w:drawing' not in seg and '<w:sectPr' not in seg, nome
        trocas.append((ini, fim, espaco.join(novo_par(t) for t in textos) + espaco))
    for ini, fim, novo in sorted(trocas, reverse=True):
        xml = xml[:ini] + novo + xml[fim:]
    return xml, len(trocas)


def trocar_tabela(arquivos, xlsx):
    xml = arquivos['word/document.xml'].decode()
    m = re.search(r'<w:drawing>.*?</w:drawing>', xml, re.S)
    rid = re.search(r'r:embed="([^"]+)"', m.group()).group(1)
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 't.png')
        periodos, cab, linhas = tabela_resultados.ler(xlsx)
        w, h = tabela_resultados.desenhar(periodos, cab, linhas, png)
        arquivos['word/media/tabela_resultados.png'] = open(png, 'rb').read()
    rels = arquivos['word/_rels/document.xml.rels'].decode()
    antigo = re.search(rf'<Relationship Id="{rid}"[^>]*Target="([^"]+)"', rels).group(1)
    rels = re.sub(rf'(<Relationship Id="{rid}"[^>]*Target=")[^"]+"', r'\1media/tabela_resultados.png"', rels)
    arquivos['word/_rels/document.xml.rels'] = rels.encode()
    # a imagem antiga sai do pacote se nada mais a usa
    if not any(f'"{antigo}"' in v.decode(errors='ignore') for k, v in arquivos.items() if k.endswith('.rels')):
        arquivos.pop('word/' + antigo, None)
    ct = arquivos['[Content_Types].xml'].decode()
    if 'Extension="png"' not in ct:
        ct = ct.replace('<Default ', '<Default Extension="png" ContentType="image/png"/><Default ', 1)
        arquivos['[Content_Types].xml'] = ct.encode()
    # mantém a largura da imagem no documento e ajusta a altura à proporção da nova tabela
    cx = int(re.search(r'<wp:extent cx="(\d+)"', m.group()).group(1))
    cy = round(cx * h / w)
    d = re.sub(r'(<wp:extent cx="\d+" cy=")\d+', rf'\g<1>{cy}', m.group())
    d = re.sub(r'(<a:ext cx="\d+" cy=")\d+', rf'\g<1>{cy}', d)
    arquivos['word/document.xml'] = (xml[:m.start()] + d + xml[m.end():]).encode()
    datas = {tabela_resultados.fmt(l[6]) for l in linhas if l[6] is not None and not isinstance(l[6], str)}
    return ', '.join(sorted(datas))


def trocar_mes(arquivos, mes):
    h = arquivos['word/header1.xml'].decode()
    antes = [m for m in MESES if f'>{m}<' in h]
    assert antes, 'mês não encontrado no cabeçalho'
    h = h.replace(f'>{antes[0]}<', f'>{mes}<')
    arquivos['word/header1.xml'] = h.encode()
    return antes[0], h.count(f'>{mes}<')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('base')
    ap.add_argument('comentarios')
    ap.add_argument('saida')
    ap.add_argument('--tabela')
    ap.add_argument('--mes', choices=MESES)
    a = ap.parse_args()

    zin = zipfile.ZipFile(a.base)
    arquivos = {i.filename: zin.read(i.filename) for i in zin.infolist()}
    comentarios = runpy.run_path(a.comentarios)['COMENTARIOS']
    xml, n = trocar_comentarios(arquivos['word/document.xml'].decode(), comentarios)
    arquivos['word/document.xml'] = xml.encode()
    print(f'comentários: {n} fundos')
    if a.tabela:
        print('tabela: data de retorno', trocar_tabela(arquivos, a.tabela))
    if a.mes:
        antes, vezes = trocar_mes(arquivos, a.mes)
        print(f'cabeçalho: {antes} -> {a.mes} ({vezes}x)')

    ids = re.findall(r'w14:paraId="([0-9A-Fa-f]+)"', arquivos['word/document.xml'].decode())
    assert len(ids) == len(set(ids)), 'w14:paraId repetido'
    nomes = [i.filename for i in zin.infolist() if i.filename in arquivos]
    nomes += [n for n in arquivos if n not in nomes]
    with zipfile.ZipFile(a.saida, 'w', zipfile.ZIP_DEFLATED) as zout:
        for nome in nomes:
            zout.writestr(nome, arquivos[nome])
    print('ok:', a.saida)


if __name__ == '__main__':
    main()
