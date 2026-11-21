"""
FairPay Python Statistical Engine (Vercel Serverless + Local CLI)
Uses scipy.stats.shapiro and scipy.stats.levene when SciPy is available (Vercel runtime),
with an exact pure-Python Royston AS R94 + Brown-Forsythe fallback so it runs identically
in any Python 3.9+ environment without native wheel dependencies.
"""

from __future__ import annotations

import json
import math
import sys
from typing import Any, Dict, List, Tuple

try:
    from scipy import stats as scipy_stats  # type: ignore

    HAS_SCIPY = True
except Exception:
    scipy_stats = None
    HAS_SCIPY = False


def engine_name() -> str:
    return "python-scipy" if HAS_SCIPY else "python-stdlib"


def _mean(vals: List[float]) -> float:
    return sum(vals) / len(vals) if vals else 0.0


def _quantile_sorted(sorted_vals: List[float], p: float) -> float:
    n = len(sorted_vals)
    if n == 0:
        return 0.0
    if n == 1:
        return sorted_vals[0]
    idx = p * (n - 1)
    lo = int(math.floor(idx))
    hi = int(math.ceil(idx))
    if lo == hi:
        return sorted_vals[lo]
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (idx - lo)


def _median(vals: List[float]) -> float:
    if not vals:
        return 0.0
    return _quantile_sorted(sorted(vals), 0.5)


def _sample_variance(vals: List[float]) -> float:
    n = len(vals)
    if n < 2:
        return 0.0
    m = _mean(vals)
    return sum((v - m) ** 2 for v in vals) / (n - 1)


def _normal_cdf(z: float) -> float:
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _normal_inv_cdf(p: float) -> float:
    if p <= 0.0:
        return -8.0
    if p >= 1.0:
        return 8.0
    if p == 0.5:
        return 0.0
    a = [
        -3.969683028665376e1,
        2.209460984245205e2,
        -2.759285104469687e2,
        1.38357751867269e2,
        -3.066479806614716e1,
        2.506628277459239,
    ]
    b = [
        -5.447609879822406e1,
        1.615858368580409e2,
        -1.556989798598866e2,
        6.680131188771972e1,
        -1.328068155288572e1,
    ]
    c = [
        -7.784894002430293e-3,
        -3.223964580411365e-1,
        -2.400758277161838,
        -2.549732539343734,
        4.374664141464968,
        2.938163982698783,
    ]
    d = [
        7.784695709041462e-3,
        3.224671290700398e-1,
        2.445134137142996,
        3.754408661907416,
    ]
    p_low = 0.02425
    p_high = 1.0 - p_low
    if p < p_low:
        q = math.sqrt(-2.0 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
            (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0
        )
    if p <= p_high:
        q = p - 0.5
        r = q * q
        return (
            (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
        ) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    q = math.sqrt(-2.0 * math.log(1.0 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
        (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0
    )


def _betacf(a: float, b: float, x: float) -> float:
    max_iter = 200
    eps = 3e-12
    fpmin = 1e-30
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < fpmin:
        d = fpmin
    d = 1.0 / d
    h = d
    for m in range(1, max_iter + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < fpmin:
            d = fpmin
        c = 1.0 + aa / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < fpmin:
            d = fpmin
        c = 1.0 + aa / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < eps:
            break
    return h


def _reg_inc_beta(a: float, b: float, x: float) -> float:
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    bt = math.exp(
        math.lgamma(a + b)
        - math.lgamma(a)
        - math.lgamma(b)
        + a * math.log(x)
        + b * math.log(1.0 - x)
    )
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * _betacf(a, b, x) / a
    return 1.0 - bt * _betacf(b, a, 1.0 - x) / b


def _f_survival(f_val: float, df1: int, df2: int) -> float:
    if f_val <= 0.0 or df1 <= 0 or df2 <= 0:
        return 1.0
    x = df2 / (df2 + df1 * f_val)
    return max(0.0, min(1.0, _reg_inc_beta(df2 / 2.0, df1 / 2.0, x)))


def shapiro_wilk(values: List[float]) -> Tuple[float, float]:
    n = len(values)
    if n < 3:
        return (1.0, 1.0)
    if HAS_SCIPY:
        res = scipy_stats.shapiro(values[:5000])
        return (float(res.statistic), float(res.pvalue))

    x = sorted(values[:5000])
    n = len(x)
    x_mean = _mean(x)
    ss = sum((v - x_mean) ** 2 for v in x)
    if ss <= 1e-15:
        return (1.0, 1.0)
    if n == 3:
        w = min(1.0, (0.5 * (x[2] - x[0]) ** 2) / ss)
        p = max(
            0.0,
            min(1.0, (6.0 / math.pi) * (math.asin(math.sqrt(w)) - math.asin(math.sqrt(0.75)))),
        )
        return (w, p)

    m = [_normal_inv_cdf((i + 1 - 0.375) / (n + 0.25)) for i in range(n)]
    m_sq = sum(v * v for v in m)
    inv_sqrt_m = 1.0 / math.sqrt(m_sq)
    c = [v * inv_sqrt_m for v in m]
    u = 1.0 / math.sqrt(n)

    def poly1(v: float) -> float:
        return (((((-2.706056 * v + 4.434685) * v - 2.07119) * v - 0.147981) * v + 0.221157) * v)

    def poly2(v: float) -> float:
        return (((((-3.582633 * v + 5.682633) * v - 1.752461) * v - 0.293762) * v + 0.042981) * v)

    a = [0.0] * n
    a[n - 1] = poly1(u) + c[n - 1]
    a[0] = -a[n - 1]

    if n >= 6:
        a[n - 2] = poly2(u) + c[n - 2]
        a[1] = -a[n - 2]
        phi = (m_sq - 2.0 * m[n - 1] ** 2 - 2.0 * m[n - 2] ** 2) / (
            1.0 - 2.0 * a[n - 1] ** 2 - 2.0 * a[n - 2] ** 2
        )
        sqrt_phi = math.sqrt(max(1e-12, phi))
        for i in range(2, n - 2):
            a[i] = m[i] / sqrt_phi
    else:
        phi = (m_sq - 2.0 * m[n - 1] ** 2) / (1.0 - 2.0 * a[n - 1] ** 2)
        sqrt_phi = math.sqrt(max(1e-12, phi))
        for i in range(1, n - 1):
            a[i] = m[i] / sqrt_phi

    num = sum(a[i] * x[i] for i in range(n))
    w = max(0.0, min(1.0, (num * num) / ss))
    one_minus_w = max(1e-15, 1.0 - w)

    if n <= 11:
        gamma = 0.459 * n - 2.273
        y = -math.log(max(1e-15, gamma - math.log(one_minus_w)))
        mu = -0.0006714 * (n**3) + 0.025054 * (n**2) - 0.39978 * n + 0.544
        sigma = math.exp(-0.0020322 * (n**3) + 0.062767 * (n**2) - 0.77857 * n + 1.3822)
        p = 1.0 - _normal_cdf((y - mu) / sigma)
    else:
        y = math.log(one_minus_w)
        ln_n = math.log(n)
        mu = 0.0038915 * (ln_n**3) - 0.083751 * (ln_n**2) - 0.31082 * ln_n - 1.5861
        sigma = math.exp(0.0030302 * (ln_n**2) - 0.082676 * ln_n - 0.4803)
        p = 1.0 - _normal_cdf((y - mu) / sigma)

    return (w, max(0.0, min(1.0, p)))


def levene_test(groups: List[List[float]]) -> Dict[str, Any]:
    valid = [g for g in groups if len(g) >= 2]
    k = len(valid)
    if k < 2:
        return {"fStatistic": 0.0, "pValue": 1.0, "df1": 0, "df2": 0}
    total_n = sum(len(g) for g in valid)
    df1 = k - 1
    df2 = total_n - k
    if HAS_SCIPY:
        res = scipy_stats.levene(*valid, center="median")
        return {
            "fStatistic": float(res.statistic),
            "pValue": float(res.pvalue),
            "df1": df1,
            "df2": df2,
        }

    z_groups = []
    grand_sum = 0.0
    for g in valid:
        med = _median(g)
        z = [abs(v - med) for v in g]
        z_groups.append(z)
        grand_sum += sum(z)
    grand_mean = grand_sum / total_n
    ss_between = 0.0
    ss_within = 0.0
    for z in z_groups:
        gm = _mean(z)
        ss_between += len(z) * (gm - grand_mean) ** 2
        ss_within += sum((v - gm) ** 2 for v in z)
    if ss_within <= 1e-15:
        return {"fStatistic": 0.0, "pValue": 1.0, "df1": df1, "df2": df2}
    f_stat = (df2 * ss_between) / (df1 * ss_within)
    p_val = _f_survival(f_stat, df1, df2)
    return {"fStatistic": f_stat, "pValue": p_val, "df1": df1, "df2": df2}


def handle_analyze(payload: Dict[str, Any]) -> Dict[str, Any]:
    salaries: List[float] = [float(x) for x in payload.get("salaries", []) if x is not None]
    groups: List[str] = [str(g) for g in payload.get("groups", [])]
    log_salaries = [math.log(s) for s in salaries if s > 0]

    w_raw, p_raw = shapiro_wilk(salaries)
    w_log, p_log = shapiro_wilk(log_salaries)

    grouped: Dict[str, List[float]] = {}
    for s, g in zip(salaries, groups):
        grouped.setdefault(g, []).append(s)
    levene = levene_test(list(grouped.values()))

    return {
        "engineSource": engine_name(),
        "shapiroRaw": {"wStatistic": w_raw, "pValue": p_raw, "isNormal": p_raw >= 0.05},
        "shapiroLog": {"wStatistic": w_log, "pValue": p_log, "isNormal": p_log >= 0.05},
        "levene": {
            "fStatistic": levene["fStatistic"],
            "pValue": levene["pValue"],
            "df1": levene["df1"],
            "df2": levene["df2"],
            "isHomogeneous": levene["pValue"] >= 0.05,
        },
    }


def main() -> None:
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"status": "ok", "engineSource": engine_name()}))
        return
    req = json.loads(raw)
    action = req.get("action", "analyze")
    if action == "health":
        print(json.dumps({"status": "ok", "engineSource": engine_name()}))
    else:
        print(json.dumps(handle_analyze(req)))


if __name__ == "__main__":
    main()
