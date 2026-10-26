"""日本食品標準成分表の Excel を、アプリで使う public/foods.json に直す。

使い方（成分表が新しくなったときに使う）:
  1. https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm から
     「第2章（データ）」の Excel をダウンロードする
  2. python3 scripts/convert_foods.py ダウンロードしたファイル.xlsx
  3. src/features/meal/foodData.js の出典（FOOD_SOURCE）の版を確かめる

出力の形：[[食品番号, 食品名, kcal, たんぱく質g, 脂質g, 炭水化物g], ...]（可食部100gあたり）
数字が分からないもの（'-'）は null、微量（'Tr'）は 0、推定値の (  ) は外して数字にする。
"""
import json
import sys

import openpyxl

# 列の位置は「成分識別子」の行で探す
COLUMNS = {'kcal': 'ENERC_KCAL', 'protein': 'PROT-', 'fat': 'FAT-', 'carbs': 'CHOCDF-'}


def to_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    text = str(value).strip().strip('()')
    if text in ('', '-', '*'):
        return None
    if text == 'Tr':
        return 0
    return float(text)


def main(path):
    sheet = openpyxl.load_workbook(path, read_only=True, data_only=True)['表全体']
    rows = list(sheet.iter_rows(values_only=True))
    header = next(i for i, r in enumerate(rows) if '成分識別子' in r)
    index = {key: rows[header].index(code) for key, code in COLUMNS.items()}
    foods = []
    for r in rows[header + 1:]:
        if not r[1]:
            continue
        name = str(r[3]).replace('　', ' ').strip()
        values = [to_number(r[index[k]]) for k in COLUMNS]
        foods.append([str(r[1]), name, *values])
    with open('public/foods.json', 'w', encoding='utf-8') as f:
        json.dump(foods, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(foods)} 食品を public/foods.json に書き出しました')


if __name__ == '__main__':
    main(sys.argv[1])
