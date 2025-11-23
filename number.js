
    const suffixes = {
        K: 1e3,
        M: 1e6,
        B: 1e9,
        T: 1e12,
        Qu: 1e15,
        Qi: 1e18,
        Sx: 1e21,
        Sp: 1e24,
    };

function expandNumber(str) {
    if (typeof str !== 'string') return str;
    str = str.trim();
    const match = /^([\d,]*\.?\d+)\s*([a-zA-Z]{1,2})$/.exec(str);
    if (!match) return str;
    let [, num, suf] = match;
    num = parseFloat(num.replace(/,/g, ''));
    suf = suf.toLowerCase();
    if (!(suf in suffixes)) return str;
    return String(num * suffixes[suf]);
}

    function shortenNumber(input) {
        let num = Number(String(input).replace(/,/g, ''));
        if (isNaN(num)) return input;
        const entries = Object.entries(suffixes).sort((a,b) => b[1] - a[1]);
        for (const [suffix, value] of entries) {
            if (num >= value) {
                const short = num / value;
                const formatted = short >= 100 ? Math.round(short)
                    : (short < 10 ? Number(short.toFixed(1)) : Math.round(short));
                // Ensure integer-like values print without trailing .0
                return String(formatted) + suffix;
            }
        }
        return String(num);
    }
