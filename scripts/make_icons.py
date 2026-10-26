"""アプリのアイコン（青い背景に白いダンベル）を作る。

使い方：python3 scripts/make_icons.py
public/icons/ に、ホーム画面用のアイコン画像を書き出す。
"""
from PIL import Image, ImageDraw

BLUE = (10, 132, 255)
WHITE = (255, 255, 255)
SIZE = 1024


def draw(scale):
    """scale：ダンベルの大きさ（1.0 でいっぱい近く）。Android の丸いアイコン用には小さめにする"""
    img = Image.new('RGB', (SIZE, SIZE), BLUE)
    d = ImageDraw.Draw(img)
    c = SIZE / 2

    def rect(x0, y0, x1, y1, r):
        d.rounded_rectangle([c + x0 * scale, c + y0 * scale, c + x1 * scale, c + y1 * scale], radius=r * scale, fill=WHITE)

    rect(-300, -28, 300, 28, 14)  # 持つところ
    for side in (-1, 1):
        x_in, x_out = side * 160, side * 250
        rect(min(x_in, x_out), -190, max(x_in, x_out), 190, 36)  # 大きいおもり
        x_in, x_out = side * 260, side * 330
        rect(min(x_in, x_out), -120, max(x_in, x_out), 120, 28)  # 小さいおもり
    return img


def save(img, size, name):
    img.resize((size, size), Image.LANCZOS).save(f'public/icons/{name}', optimize=True)


normal = draw(1.0)
save(normal, 180, 'apple-touch-icon.png')  # iPhone のホーム画面用
save(normal, 192, 'icon-192.png')
save(normal, 512, 'icon-512.png')
save(draw(0.75), 512, 'icon-maskable-512.png')  # 角が丸く切られても欠けないよう小さめ
print('public/icons/ にアイコンを書き出しました')
