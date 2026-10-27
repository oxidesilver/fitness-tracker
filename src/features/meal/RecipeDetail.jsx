import { useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import { recipeItems } from './foodData.js'

// 料理のひな形を選んだあとの画面。材料ごとに量を直してから、まとめて献立に追加する。
// onAdd には recipeItems の戻り値（献立の品の一覧）を渡す
export default function RecipeDetail({ recipe, foods, onAdd, onBack }) {
  const [grams, setGrams] = useState(() => recipe.items.map(([, g]) => String(g)))
  const items = recipeItems(recipe, foods, grams)
  const total = items.reduce(
    (t, i) => ({ kcal: t.kcal + i.kcal, protein: t.protein + (i.protein ?? 0), fat: t.fat + (i.fat ?? 0), carbs: t.carbs + (i.carbs ?? 0) }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  )
  const r1 = (n) => Math.round(n * 10) / 10

  return (
    <>
      <p className="food-picked">{recipe.name}（1人分の目安）</p>
      <p className="meal-help">材料ごとの量は目安です。食べた量に合わせて直してください。0にするとその材料は入りません。</p>
      <ul className="recipe-items">
        {recipe.items.map(([code, , label], i) => (
          <li key={`${code}-${i}`}>
            <span className="recipe-item-name">{label}</span>
            <Stepper
              label={`${label}の量`}
              value={grams[i]}
              onChange={(v) => setGrams(grams.map((g, j) => (j === i ? v : g)))}
              step={Number(recipe.items[i][1]) >= 50 ? 10 : 1}
              unit="g"
              placeholder="0"
            />
          </li>
        ))}
      </ul>
      <p className="food-values">
        合計 {total.kcal}kcal ・たんぱく質{r1(total.protein)}g ・脂質{r1(total.fat)}g ・炭水化物{r1(total.carbs)}g
      </p>
      <div className="food-buttons">
        <button type="button" className="primary" onClick={() => onAdd(items)} disabled={items.length === 0}>
          献立に追加（{items.length}品）
        </button>
        <button type="button" className="food-back" onClick={onBack}>選び直す</button>
      </div>
    </>
  )
}
