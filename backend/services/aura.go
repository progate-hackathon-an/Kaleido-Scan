package services

// maxRank は登録商品数に一致する想定でハードコードされている。
// TODO: 商品数が変動する場合、maxRank を DB から動的に取得する必要がある。
// 現状は商品数=5固定のため機能するが、商品が追加・削除されると
// CalcAuraLevel の計算結果が意図しない値になる点に注意。
const maxRank = 5

// CalcAuraLevel はランク（1〜maxRank）からオーラレベル（1〜maxRank）を計算する。
// rank=1（最上位）が aura_level=5（最強）を返す。全モード共通の逆転計算を適用する。
func CalcAuraLevel(rank int) int {
	return (maxRank + 1) - rank
}
