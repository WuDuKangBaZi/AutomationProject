export function normalizeDate(input: string | undefined, fallbackYear = new Date().getFullYear()): string {
    if (!input) return "";
    const s = String(input).trim().replace(/\s+/g, "");
    const today = new Date();

    function pad2(n: number) { return n.toString().padStart(2, "0"); }

    function adjustFuture(y: number, mo: number, d: number): string {
        const parsed = new Date(y, mo - 1, d);
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (parsed < todayMid) parsed.setFullYear(y + 1);
        return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    }

    // 辅助：把字符串安全转换为整数并校验范围
    function toIntAndValidate(s: string | undefined): number | undefined {
        if (!s) return undefined;
        const n = Number(s);
        if (!Number.isFinite(n)) return undefined;
        return Math.trunc(n);
    }

    // YYYY/MM/DD 或 YYYY-M-D 或 YYYY.M.D
    {
        const m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
        if (m) {
            const [, yStr, moStr, dStr] = m;
            const yNum = toIntAndValidate(yStr);
            const moNum = toIntAndValidate(moStr);
            const dNum = toIntAndValidate(dStr);
            if (yNum !== undefined && moNum !== undefined && dNum !== undefined) {
                if (moNum >= 1 && moNum <= 12 && dNum >= 1 && dNum <= 31) {
                    return adjustFuture(yNum, moNum, dNum);
                }
            }
        }
    }

    // 中文格式：可选年 + 月日（如 2025年9月10日 或 9月10日）
    {
        const m = s.match(/^(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日$/);
        if (m) {
            const [, yStr, moStr, dStr] = m;
            const moNum = toIntAndValidate(moStr);
            const dNum = toIntAndValidate(dStr);
            // 年可能缺失，使用 fallbackYear
            const yNum = yStr ? toIntAndValidate(yStr) : fallbackYear;
            // yNum 这里要保证是 number（fallbackYear 肯定是 number）
            const finalY = typeof yNum === "number" ? yNum : fallbackYear;
            if (moNum !== undefined && dNum !== undefined) {
                if (moNum >= 1 && moNum <= 12 && dNum >= 1 && dNum <= 31) {
                    return adjustFuture(finalY, moNum, dNum);
                }
            }
        }
    }

    // 仅月日：M-D / M/D / M.D -> 使用 fallbackYear
    {
        const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
        if (m) {
            const [, moStr, dStr] = m;
            const moNum = toIntAndValidate(moStr);
            const dNum = toIntAndValidate(dStr);
            if (moNum !== undefined && dNum !== undefined) {
                if (moNum >= 1 && moNum <= 12 && dNum >= 1 && dNum <= 31) {
                    return adjustFuture(fallbackYear, moNum, dNum);
                }
            }
        }
    }

    // 已是标准 YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const parts = s.split("-");
        const yNum = toIntAndValidate(parts[0]);
        const moNum = toIntAndValidate(parts[1]);
        const dNum = toIntAndValidate(parts[2]);
        if (yNum !== undefined && moNum !== undefined && dNum !== undefined) {
            return adjustFuture(yNum, moNum, dNum);
        }
    }

    return s;
}
