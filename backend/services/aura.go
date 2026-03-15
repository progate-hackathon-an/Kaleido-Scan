package services

const maxRank = 5

// CalcAuraLevel はランク（1〜maxRank）からオーラレベル（1〜maxRank）を計算する。
// rank=1（最上位）が aura_level=5（最強）を返す。全モード共通の逆転計算を適用する。
func CalcAuraLevel(rank int, _ string) int {
	return (maxRank + 1) - rank
}
