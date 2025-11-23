
    const suffixes = {
        k: 1e3,
        m: 1e6,
        b: 1e9,
        t: 1e12,
        qu: 1e15,
        qi: 1e18,
        sx: 1e21,
        sp: 1e24,
        oc: 1e27,
        no: 1e30,
        dc: 1e33,
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
                return String(formatted) + suffix.charAt(0).toUpperCase()+suffix.slice(1);;
            }
        }
        return String(num);
    }
