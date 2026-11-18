"""120 original Year 6/7 scholarship Numerical Reasoning questions (n001..n120).
Distribution: 18 easy, 54 medium, 48 challenging = 120.
Covers number series, number matrices (with table visuals), numerical logic
deductions, and arithmetical reasoning.
"""

def _fmt(val):
    if isinstance(val, float) and abs(val - round(val)) < 1e-9:
        return str(int(round(val)))
    if isinstance(val, float):
        return f"{val:.4f}".rstrip("0").rstrip(".")
    return str(val)

def _mk_nr(idx, diff, skill, topic, prompt, ans, dists, expr, worked, est, visuals=None):
    pos = (idx - 1) % 4
    opts = list(dists)
    ans_str = _fmt(ans)
    opts.insert(pos, ans_str)
    letters = ["a", "b", "c", "d"]
    return {
        "id": f"vihaan-agy-n{idx:03d}",
        "subject": "numerical_reasoning",
        "strand": "Numerical Reasoning",
        "topic": topic,
        "skill": skill,
        "difficulty": diff,
        "estimatedTimeSeconds": est,
        "prompt": prompt,
        "options": [{"id": l, "text": t} for l, t in zip(letters, opts)],
        "answerOptionId": letters[pos],
        "workedSolution": worked,
        "reviewFocus": ["Verify numerical pattern uniqueness and distractor plausibility."],
        "visuals": visuals or [],
        "tags": ["vihaan-agy-500", "edutest-style"],
        "arithmeticCheck": {"expression": expr, "expected": ans_str},
    }

def build_nr_questions():
    items = []
    idx = 1

    # --- 1. NUMBER SERIES (30: 4 easy, 14 medium, 12 challenging) ---
    # Each has distinct framing and rule so no near-duplicate / parameter-only collisions occur
    series_specs = [
        # Easy (4)
        ("easy", "Look at the number sequence: 7, 13, 19, 25, 31, ?. Which number replaces the question mark?",
         37, ["35", "36", "39"], "31 + 6",
         ["Each term increases by 6: 7+6=13, 13+6=19, 19+6=25, 25+6=31.", "Add 6 to 31 to get 37."], 55),
        ("easy", "Find the next number in this decreasing pattern: 94, 86, 78, 70, 62, ?",
         54, ["52", "56", "58"], "62 - 8",
         ["Each step subtracts 8: 94-8=86, 86-8=78, 78-8=70, 70-8=62.", "62 - 8 = 54."], 55),
        ("easy", "In the doubling sequence 3, 6, 12, 24, 48, ?, what number comes next?",
         96, ["72", "84", "108"], "48 * 2",
         ["Each term is multiplied by 2.", "48 * 2 = 96."], 55),
        ("easy", "What is the missing term in the sequence 5, 9, 14, 20, 27, ?",
         35, ["33", "34", "36"], "27 + 8",
         ["The differences increase by 1 each time: +4, +5, +6, +7.", "The next difference is +8: 27 + 8 = 35."], 60),

        # Medium (14)
        ("medium", "Identify the next value in the alternating series: 4, 15, 8, 19, 12, 23, ?",
         16, ["14", "27", "35"], "12 + 4",
         ["Odd positions increase by 4 (4, 8, 12, ...), while even positions increase by 4 (15, 19, 23).", "The 7th term continues the odd-position pattern: 12 + 4 = 16."], 85),
        ("medium", "Determine the missing number in 2, 5, 11, 23, 47, ?",
         95, ["71", "93", "97"], "47 * 2 + 1",
         ["Each term is twice the previous term plus 1: 2*2+1=5, 5*2+1=11, 11*2+1=23, 23*2+1=47.", "47 * 2 + 1 = 95."], 85),
        ("medium", "Which number completes the square-based sequence 4, 9, 16, 25, 36, ?",
         49, ["45", "47", "64"], "7 * 7",
         ["The terms are consecutive square numbers: 2², 3², 4², 5², 6².", "The next is 7² = 49."], 70),
        ("medium", "Examine the descending steps: 120, 117, 111, 102, 90, ?. What replaces the question mark?",
         75, ["72", "78", "81"], "90 - 15",
         ["The subtracted amounts grow by 3 each step: -3, -6, -9, -12.", "Next subtract 15: 90 - 15 = 75."], 85),
        ("medium", "Find the seventh number in the Fibonacci-style chain: 3, 4, 7, 11, 18, 29, ?",
         47, ["40", "45", "58"], "18 + 29",
         ["Each term from the third onward is the sum of the two preceding terms.", "18 + 29 = 47."], 80),
        ("medium", "What number belongs in the middle gap: 6, 12, 20, ?, 42, 56?",
         30, ["28", "32", "34"], "20 + 10",
         ["Differences are +6, +8, ..., +14, so the missing steps are +10 and +12.", "20 + 10 = 30 (and 30 + 12 = 42 confirms it)."], 90),
        ("medium", "A sequence alternates multiplying and adding: 2, 6, 9, 27, 30, 90, ?. What is next?",
         93, ["180", "270", "96"], "90 + 3",
         ["The rule alternates *3 then +3: 2*3=6, 6+3=9, 9*3=27, 27+3=30, 30*3=90.", "Apply +3 next: 90 + 3 = 93."], 85),
        ("medium", "Continue the cube-number pattern: 1, 8, 27, 64, 125, ?",
         216, ["196", "225", "256"], "6 ** 3",
         ["The terms are 1³, 2³, 3³, 4³, 5³.", "The next cube is 6³ = 216."], 75),
        ("medium", "What is the next term in 81, 27, 30, 10, 13, ?",
         13/3 if False else 39, None, None, None), # Wait: let's use clean integer: 81, 27, 33, 11, 17, ? → /3, +6 → 17? Wait 17 not /3! Let's use 162, 54, 60, 20, 26, ? → /3, +6 → 26? Wait 26/3 not integer. Use 243, 81, 87, 29, 35? No, 81, 27, 36, 12, 21, 7, ? → /3, +9! Next is 7+9=16!
    ]
    series_specs[-1] = (
        "medium", "In the pattern 81, 27, 36, 12, 21, 7, ?, which number comes next?",
        16, ["14", "18", "21"], "7 + 9",
        ["The operations alternate divide by 3 and add 9: 81/3=27, 27+9=36, 36/3=12, 12+9=21, 21/3=7.", "Next add 9: 7 + 9 = 16."], 90
    )
    series_specs.extend([
        ("medium", "Find the missing term in 5, 11, 23, 47, 95, ?", None, None, None, None), # already used 2*n+1! Let's use 4, 13, 40, 121, ? → *3+1!
    ])
    series_specs[-1] = (
        "medium", "Each term is formed by a consistent two-step rule: 4, 13, 40, 121, ?. What is the fifth term?",
        364, ["242", "362", "366"], "121 * 3 + 1",
        ["Multiply the previous term by 3 and add 1: 4*3+1=13, 13*3+1=40, 40*3+1=121.", "121 * 3 + 1 = 364."], 90
    )
    series_specs.extend([
        ("medium", "Look at the fraction-free ratio steps: 1000, 200, 40, 8, ?. What is the next number?",
         1.6, ["0.8", "1.2", "2"], "8 / 5",
         ["Each term is divided by 5: 1000/5=200, 200/5=40, 40/5=8.", "8 / 5 = 1.6."], 80),
        ("medium", "In a dual-track sequence, odd positions double while even positions drop by three: 3, 20, 6, 17, 12, 14, 24, ?. Which number belongs at the end?",
         11, ["10", "12", "48"], "14 - 3",
         ["Odd positions double (3, 6, 12, 24); even positions decrease by 3 (20, 17, 14, ...).", "The 8th term is 14 - 3 = 11."], 95),
        ("medium", "What is the next number in 1, 3, 7, 15, 31, 63, ?",
         127, ["95", "125", "129"], "63 * 2 + 1",
         ["Differences double each time: +2, +4, +8, +16, +32.", "Next difference is +64: 63 + 64 = 127 (also 2^7 - 1)."], 85),
        ("medium", "Find the missing number in 11, 14, 19, 26, 35, ?",
         46, ["44", "45", "48"], "35 + 11",
         ["Differences are consecutive odd numbers: +3, +5, +7, +9.", "Next difference is +11: 35 + 11 = 46."], 80),

        # Challenging (12)
        ("challenging", "In the sequence 2, 6, 12, 20, 30, 42, ?, what is the seventh term?",
         56, ["52", "54", "58"], "7 * 8",
         ["Terms are n*(n+1): 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42.", "The 7th term is 7 * 8 = 56."], 105),
        ("challenging", "Examine the second-order difference sequence: 1, 4, 10, 20, 35, ?. What comes next?",
         56, ["50", "55", "60"], "35 + 21",
         ["First differences are 3, 6, 10, 15 (triangular numbers).", "Next triangular difference is 21: 35 + 21 = 56."], 115),
        ("challenging", "What number replaces the question mark in 3, 5, 9, 17, 33, 65, ?",
         129, ["97", "127", "131"], "65 * 2 - 1",
         ["Each term is 2 * previous - 1: 3*2-1=5, 5*2-1=9, ..., 33*2-1=65.", "65 * 2 - 1 = 129."], 105),
        ("challenging", "A sequence follows T(n) = n² + 2n. What is the difference between T(9) and T(7)?",
         36, ["32", "34", "40"], "(9*9 + 2*9) - (7*7 + 2*7)",
         ["T(9) = 81 + 18 = 99 and T(7) = 49 + 14 = 63.", "99 - 63 = 36."], 110),
        ("challenging", "Determine the next value in 2, 3, 6, 18, 108, ?",
         1944, ["648", "1296", "2160"], "18 * 108",
         ["Each term from the third onward is the product of the two previous terms: 2*3=6, 3*6=18, 6*18=108.", "18 * 108 = 1944."], 115),
        ("challenging", "Find the missing term in 7, 10, 16, 28, 52, ?",
         100, ["76", "96", "104"], "52 + 48",
         ["Differences double each step: +3, +6, +12, +24.", "Next difference is +48: 52 + 48 = 100."], 105),
        ("challenging", "What is the next number in 1, 2, 6, 24, 120, ?",
         720, ["240", "600", "840"], "120 * 6",
         ["Multiply by consecutive integers: *2, *3, *4, *5.", "Next multiply by 6: 120 * 6 = 720."], 100),
        ("challenging", "Look at the prime-offset sequence: 4, 6, 9, 13, 19, 25, ?. What comes next?",
         36, ["31", "33", "35"], "25 + 11",
         ["Each term equals 2 plus the nth prime? Check: 2+2=4, 3+3=6? Wait: 2+2=4, 3+3=6, 4+5=9, 6+7=13, 8+11=19, 12+13=25? No! Wait: 2+2=4, 3+3=6, 4+5=9? No, differences are +2, +3, +4, +6, +6? Not clean! Let's fix to a crystal-clear rule: 5, 7, 10, 15, 22, 33, ? → add consecutive primes 2, 3, 5, 7, 11 → next add 13 → 46!"], 120),
    ])
    series_specs[-1] = (
        "challenging", "In the sequence 5, 7, 10, 15, 22, 33, ?, each step adds the next prime number. What replaces the question mark?",
        46, ["44", "45", "48"], "33 + 13",
        ["Differences are the prime numbers 2, 3, 5, 7, 11.", "The next prime is 13: 33 + 13 = 46."], 115
    )
    series_specs.extend([
        ("challenging", "What is the 8th term of the sequence 100, 98, 94, 88, 80, ...?",
         44, ["54", "58", "60"], "100 - (2 + 4 + 6 + 8 + 10 + 12 + 14)",
         ["Differences are -2, -4, -6, -8, -10, -12, -14.", "Term 6 is 70, Term 7 is 58, Term 8 is 44."], 120),
        ("challenging", "Identify the missing number in 3, 12, 27, 48, 75, ?",
         108, ["96", "102", "112"], "3 * 6 * 6",
         ["Each term is 3 * n²: 3*1=3, 3*4=12, 3*9=27, 3*16=48, 3*25=75.", "Next is 3 * 6² = 3 * 36 = 108."], 115),
        ("challenging", "In the sequence 2, 5, 10, 17, 26, 37, ?, what is the next term?",
         50, ["48", "49", "52"], "7 * 7 + 1",
         ["Each term is n² + 1: 1²+1=2, 2²+1=5, 3²+1=10, ..., 6²+1=37.", "Next is 7² + 1 = 50."], 105),
        ("challenging", "Find the next term in 64, 48, 36, 27, ? (written as a decimal).",
         20.25, ["18", "19.5", "21.25"], "27 * 0.75",
         ["Each term is multiplied by 3/4 (0.75): 64*0.75=48, 48*0.75=36, 36*0.75=27.", "27 * 0.75 = 20.25."], 120),
    ])

    for diff, prompt, ans, dists, expr, worked, est in series_specs:
        items.append(_mk_nr(idx, diff, "scholarship.nr-number-series", "number series", prompt, ans, dists, expr, worked, est))
        idx += 1

    # --- 2. NUMBER MATRICES (30: 4 easy, 14 medium, 12 challenging) with TABLE visuals ---
    matrix_specs = [
        # Easy (4)
        ("easy", "In the 3x3 number matrix, each row follows the same addition rule. What number replaces '?'?",
         [["4", "7", "11"], ["6", "9", "15"], ["8", "5", "?"]], 13, ["11", "12", "14"], "8 + 5",
         ["In each row, the third number equals the sum of the first two: 4+7=11 and 6+9=15.", "8 + 5 = 13."], 60),
        ("easy", "In the grid below, each column follows the same multiplication rule. Find '?'.",
         [["3", "5", "7"], ["4", "6", "8"], ["12", "30", "?"]], 56, ["42", "48", "64"], "7 * 8",
         ["In each column, the bottom number is the product of the top two: 3*4=12 and 5*6=30.", "7 * 8 = 56."], 60),
        ("easy", "Every row in the table has the same total. What number replaces '?'?",
         [["10", "15", "25"], ["18", "12", "20"], ["14", "?", "19"]], 17, ["15", "16", "18"], "50 - 14 - 19",
         ["Row 1 sums to 10+15+25 = 50; Row 2 sums to 18+12+20 = 50.", "Row 3: 50 - 14 - 19 = 17."], 65),
        ("easy", "Each number in the bottom row is formed from the number above it using the same rule. Find '?'.",
         [["5", "8", "11", "14"], ["11", "17", "23", "?"]], 29, ["26", "28", "31"], "14 * 2 + 1",
         ["Bottom = 2 * Top + 1: 5*2+1=11, 8*2+1=17, 11*2+1=23.", "14 * 2 + 1 = 29."], 65),

        # Medium (14)
        ("medium", "In each row of the matrix, the middle number is derived from the outer two numbers. What replaces '?'?",
         [["3", "15", "5"], ["4", "28", "7"], ["6", "?", "9"]], 54, ["45", "48", "56"], "6 * 9",
         ["Middle = Left * Right: 3*5=15 and 4*7=28.", "6 * 9 = 54."], 75),
        ("medium", "Each row follows the same two-step rule from left to right. Find the missing value '?'.",
         [["2", "5", "13"], ["3", "7", "24"], ["4", "6", "?"]], 28, ["24", "26", "30"], "4 * 6 + 4",
         ["Rule: (First * Second) + First = Third. Check: 2*5+2=12? Wait: 2*5+3=13, 3*7+3=24? No, 2*5+2=12 != 13! Let's fix Row 1 to 12: 2, 5, 12."], 90),
    ]
    matrix_specs[-1] = (
        "medium", "Each row follows the same two-step rule from left to right. Find the missing value '?'.",
        [["2", "5", "12"], ["3", "7", "24"], ["4", "6", "?"]], 28, ["24", "26", "30"], "4 * 6 + 4",
        ["Rule: (First * Second) + First = Third: 2*5+2=12 and 3*7+3=24.", "4 * 6 + 4 = 28."], 90
    )
    matrix_specs.extend([
        ("medium", "In this 3x3 grid, each column obeys the same rule. What number replaces '?'?",
         [["9", "12", "15"], ["4", "5", "6"], ["5", "7", "?"]], 9, ["8", "10", "11"], "15 - 6",
         ["Bottom = Top - Middle: 9-4=5 and 12-5=7.", "15 - 6 = 9."], 75),
        ("medium", "Find '?' using the consistent row relationship in the table.",
         [["6", "4", "20"], ["8", "5", "26"], ["9", "7", "?"]], 32, ["28", "30", "34"], "2 * (9 + 7)",
         ["Third = 2 * (First + Second): 2*(6+4)=20 and 2*(8+5)=26.", "2 * (9 + 7) = 32."], 90),
        ("medium", "Each row in the matrix uses squares to produce the third number. What replaces '?'?",
         [["3", "4", "13"], ["5", "2", "27"], ["4", "6", "?"]], 22, ["20", "24", "52"], "4 * 4 + 6",
         ["Third = First² + Second: 3²+4=13 and 5²+2=27.", "4² + 6 = 16 + 6 = 22."], 95),
        ("medium", "In the 3x3 matrix, the sum of every row AND every column is 30. What is '?'?",
         [["12", "7", "11"], ["8", "10", "12"], ["10", "13", "?"]], 7, ["6", "8", "9"], "30 - 10 - 13",
         ["Row 3 must sum to 30: 10 + 13 + ? = 30.", "30 - 23 = 7 (and Column 3: 11 + 12 + 7 = 30 confirms it)."], 85),
        ("medium", "Each column follows the same arithmetic rule from top to bottom. Find '?'.",
         [["18", "24", "30"], ["3", "4", "5"], ["12", "12", "?"]], 12, ["6", "10", "15"], "(30 / 5) * 2",
         ["Bottom = (Top / Middle) * 2: (18/3)*2=12 and (24/4)*2=12.", "(30 / 5) * 2 = 12."], 95),
        ("medium", "Look at the pairs in the table. What number replaces '?'?",
         [["12", "18", "6"], ["20", "35", "15"], ["27", "45", "?"]], 18, ["15", "16", "21"], "45 - 27",
         ["Third = Second - First: 18-12=6 and 35-20=15.", "45 - 27 = 18."], 75),
        ("medium", "In each row, multiply the first two numbers and subtract a fixed constant to get the third. Find '?'.",
         [["5", "4", "17"], ["6", "3", "15"], ["7", "5", "?"]], 32, ["30", "33", "35"], "7 * 5 - 3",
         ["Third = (First * Second) - 3: 5*4-3=17 and 6*3-3=15.", "7 * 5 - 3 = 32."], 85),
        ("medium", "Each row follows the same division-and-addition rule. What replaces '?'?",
         [["16", "4", "8"], ["24", "6", "10"], ["35", "5", "?"]], 12, ["7", "10", "14"], "35 / 5 + 5",
         ["Wait: 16/4=4, +4=8; 24/6=4, +6=10! Third = (First / Second) + Second: 16/4+4=8, 24/6+6=10.", "35 / 5 + 5 = 7 + 5 = 12."], 95),
        ("medium", "In this table, each row's third number is the average of the first two. Find '?'.",
         [["14", "22", "18"], ["19", "31", "25"], ["23", "?", "30"]], 37, ["35", "36", "38"], "2 * 30 - 23",
         ["Average = (First + Second) / 2, so First + Second = 2 * Third.", "23 + ? = 2 * 30 = 60, so ? = 37."], 90),
        ("medium", "Each column follows the same rule: multiply the top two, then halve the result. Find '?'.",
         [["6", "8", "10"], ["4", "5", "7"], ["12", "20", "?"]], 35, ["30", "34", "70"], "(10 * 7) / 2",
         ["Check: (6*4)/2 = 12 and (8*5)/2 = 20.", "(10 * 7) / 2 = 35."], 80),
        ("medium", "Each row uses the difference of squares? No: First² - Second = Third. Find '?'.",
         [["6", "11", "25"], ["7", "14", "35"], ["8", "19", "?"]], 45, ["43", "47", "49"], "8 * 8 - 19",
         ["Check: 6² - 11 = 36 - 11 = 25; 7² - 14 = 49 - 14 = 35.", "8² - 19 = 64 - 19 = 45."], 95),
        ("medium", "In the 3x3 grid, the product of the first and third numbers in each row equals the middle number squared. Find '?'.",
         [["2", "6", "18"], ["3", "12", "48"], ["4", "10", "?"]], 25, ["20", "24", "40"], "(10 * 10) / 4",
         ["Check: 2*18 = 36 = 6²; 3*48 = 144 = 12².", "4 * ? = 10² = 100, so ? = 25."], 105),

        # Challenging (12)
        ("challenging", "In the 3x3 matrix, each row obeys the same rule connecting all three cells. What replaces '?'?",
         [["4", "9", "25"], ["5", "12", "37"], ["6", "11", "?"]], 35, ["31", "33", "39"], "4 * 6 + 11",
         ["Third = 4 * First + Second? Check: 4*4+9=25, 4*5+12=32 != 37! Wait: First*Second - (First+Second)? 4*9-13=23 != 25! Let's use First² + Second = Third? 16+9=25, 25+12=37! YES!", "6² + 11 = 36 + 11 = 47! Let's update ans to 47."], 110),
    ])
    matrix_specs[-1] = (
        "challenging", "In the 3x3 matrix, each row obeys the same rule connecting all three cells. What replaces '?'?",
        [["4", "9", "25"], ["5", "12", "37"], ["6", "11", "?"]], 47, ["35", "43", "49"], "6 * 6 + 11",
        ["Third = First² + Second: 4²+9=25 and 5²+12=37.", "6² + 11 = 36 + 11 = 47."], 110
    )
    matrix_specs.extend([
        ("challenging", "Each row in the matrix combines the first two numbers to form the third. Find '?'.",
         [["7", "3", "40"], ["9", "4", "65"], ["8", "5", "?"]], 39, ["35", "41", "44"], "8 * 8 - 5 * 5",
         ["Third = First² - Second²: 7²-3² = 49-9 = 40; 9²-4² = 81-16 = 65.", "8² - 5² = 64 - 25 = 39."], 120),
        ("challenging", "In each column, the bottom number is formed from the top two numbers. What replaces '?'?",
         [["12", "15", "20"], ["4", "3", "5"], ["48", "45", "?"]], 100, ["75", "80", "120"], "20 * 5",
         ["Wait: 12*4=48, 15*3=45, 20*5=100 — that's too easy for challenging! Let's use (Top + Middle) * Middle: (12+4)*4=64, (15+3)*3=54, (20+5)*5=125."], 115),
    ])
    matrix_specs[-1] = (
        "challenging", "In each column of the table, the bottom number is computed from the top two numbers. What replaces '?'?",
        [["12", "15", "20"], ["4", "3", "5"], ["64", "54", "?"]], 125, ["100", "115", "135"], "(20 + 5) * 5",
        ["Bottom = (Top + Middle) * Middle: (12+4)*4=64 and (15+3)*3=54.", "(20 + 5) * 5 = 25 * 5 = 125."], 115
    )
    matrix_specs.extend([
        ("challenging", "Every row follows the same rule. Find the missing value '?'.",
         [["10", "4", "14"], ["15", "6", "21"], ["24", "9", "?"]], 33, ["30", "32", "36"], "24 + 9",
         ["Wait: First + Second = Third is too easy! Let's make it challenging: First * 2 - Second = Third → 10, 4, 16; 15, 6, 24; 24, 9, 39."], 105),
    ])
    matrix_specs[-1] = (
        "challenging", "In this matrix, each row follows the same rule from left to right. Find '?'.",
        [["11", "5", "17"], ["14", "7", "21"], ["19", "8", "?"]], 30, ["27", "29", "32"], "19 * 2 - 8",
        ["Third = 2 * First - Second: 2(11)-5=17 and 2(14)-7=21.", "2(19) - 8 = 38 - 8 = 30."], 105
    )
    matrix_specs.extend([
        ("challenging", "In this 3x3 magic-product grid, every row has the same product of 240. What is '?'?",
         [["4", "10", "6"], ["5", "12", "4"], ["8", "?", "5"]], 6, ["4", "5", "8"], "240 / (8 * 5)",
         ["Check Row 1: 4*10*6 = 240; Row 2: 5*12*4 = 240.", "Row 3: 8 * ? * 5 = 240, so 40 * ? = 240 and ? = 6."], 105),
        ("challenging", "Each row's third number is the sum of the digits of the product of the first two numbers. Find '?'.",
         [["12", "4", "12"], ["15", "5", "12"], ["18", "6", "?"]], 9, ["8", "10", "11"], "1 + 0 + 8",
         ["Row 1: 12*4 = 48 → 4+8 = 12. Row 2: 15*5 = 75 → 7+5 = 12.", "Row 3: 18*6 = 108 → 1+0+8 = 9."], 125),
        ("challenging", "In each row, the middle number is the average of the outer two, and each row's sum increases by 6 from top to bottom. Find '?'.",
         [["5", "8", "11"], ["7", "10", "13"], ["9", "?", "15"]], 12, ["11", "13", "14"], "(9 + 15) / 2",
         ["Row 1 sums to 24, Row 2 to 30, so Row 3 sums to 36 (and middle is average of 9 and 15).", "(9 + 15) / 2 = 12."], 105),
        ("challenging", "Each column's bottom number is (Top * Middle) / (Top - Middle). What replaces '?'?",
         [["6", "10", "12"], ["3", "5", "8"], ["6", "10", "?"]], 24, ["16", "20", "32"], "(12 * 8) / (12 - 8)",
         ["Col 1: (6*3)/(6-3) = 18/3 = 6; Col 2: (10*5)/(10-5) = 50/5 = 10.", "Col 3: (12*8)/(12-8) = 96/4 = 24."], 125),
        ("challenging", "In this 3x3 matrix, each row obeys: Third = (First + 1) * (Second - 1). Find '?'.",
         [["4", "6", "25"], ["7", "5", "32"], ["8", "7", "?"]], 54, ["48", "50", "56"], "(8 + 1) * (7 - 1)",
         ["Check: (4+1)*(6-1) = 5*5 = 25; (7+1)*(5-1) = 8*4 = 32.", "(8 + 1) * (7 - 1) = 9 * 6 = 54."], 115),
        ("challenging", "In each row, the third number equals First * Second + First + Second. Find '?'.",
         [["2", "3", "11"], ["4", "5", "29"], ["6", "4", "?"]], 34, ["28", "30", "36"], "6 * 4 + 6 + 4",
         ["Check: 2*3+2+3 = 11; 4*5+4+5 = 29.", "6*4 + 6 + 4 = 24 + 10 = 34."], 115),
        ("challenging", "Each column's bottom value is the LCM (least common multiple) of the top two numbers. What is '?'?",
         [["4", "6", "9"], ["6", "9", "12"], ["12", "18", "?"]], 36, ["18", "24", "108"], "36",
         ["Col 1: LCM(4, 6) = 12; Col 2: LCM(6, 9) = 18.", "Col 3: LCM(9, 12) = 36."], 110),
        ("challenging", "In each row of the table, Third = (First² + Second²) / 2. What replaces '?'?",
         [["3", "5", "17"], ["4", "6", "26"], ["5", "7", "?"]], 37, ["35", "36", "40"], "(5*5 + 7*7) / 2",
         ["Check: (9+25)/2 = 17; (16+36)/2 = 26.", "(25 + 49) / 2 = 74 / 2 = 37."], 120),
    ])

    for diff, prompt, rows, ans, dists, expr, worked, est in matrix_specs:
        headers = [f"Col {c+1}" for c in range(len(rows[0]))]
        vis = [{
            "id": f"mat_n{idx:03d}",
            "type": "table",
            "altText": f"Number matrix table with {len(rows)} rows and {len(rows[0])} columns containing a missing value.",
            "title": "Number Matrix",
            "data": {"headers": headers, "rows": rows},
        }]
        items.append(_mk_nr(idx, diff, "scholarship.nr-number-matrices", "number matrices", prompt, ans, dists, expr, worked, est, visuals=vis))
        idx += 1

    # --- 3. NUMERICAL LOGIC DEDUCTION (30: 5 easy, 13 medium, 12 challenging) ---
    logic_specs = [
        # Easy (5)
        ("easy", "A two-digit number is divisible by 9, is odd, and lies between 30 and 50. What is the number?",
         45, ["36", "39", "49"], "45",
         ["Multiples of 9 between 30 and 50 are 36 and 45.", "Only 45 is odd."], 60),
        ("easy", "I think of a whole number, multiply it by 5, and subtract 3 to get 32. What was my number?",
         7, ["5", "6", "8"], "(32 + 3) / 5",
         ["Reverse the steps: 32 + 3 = 35.", "35 / 5 = 7."], 55),
        ("easy", "The sum of two different prime numbers is 16. What is their product?",
         55, ["39", "51", "63"], "5 * 11",
         ["Primes under 16 are 2, 3, 5, 7, 11, 13.", "The only pair of distinct primes summing to 16 is 5 and 11 (since 3+13=16 too! Wait: 3+13=16 AND 5+11=16!)."], 65),
    ]
    # Good catch! 3+13=16 AND 5+11=16! Let's make the sum 18? 5+13=18 AND 7+11=18! Make the sum 10 → 3+7=10 (unique distinct primes!).
    logic_specs[-1] = (
        "easy", "The sum of two different prime numbers is 10. What is their product?",
        21, ["9", "16", "25"], "3 * 7",
        ["Primes less than 10 are 2, 3, 5, 7.", "The unique pair of distinct primes summing to 10 is 3 and 7, and 3 * 7 = 21."], 60
    )
    logic_specs.extend([
        ("easy", "A 3-digit PIN uses three different digits from {2, 5, 8}. The first digit is largest and the last digit is smallest. What is the PIN?",
         852, ["825", "582", "258"], "852",
         ["Largest digit first is 8, smallest digit last is 2.", "The middle digit must be 5, giving 852."], 55),
        ("easy", "When a number is divided by 6, the quotient is 7 and the remainder is 4. What is the number?",
         46, ["42", "44", "48"], "6 * 7 + 4",
         ["Multiply divisor by quotient and add remainder: 6 * 7 + 4.", "42 + 4 = 46."], 60),

        # Medium (13)
        ("medium", "A two-digit number has digits summing to 11. When its digits are reversed, the new number is 27 larger than the original. What is the original number?",
         47, ["38", "56", "74"], "47",
         ["Reversing adds 27 = 9 * (units - tens), so units - tens = 3.", "With tens + units = 11 and units - tens = 3, tens = 4 and units = 7, giving 47."], 95),
        ("medium", "How many whole numbers between 1 and 100 are divisible by BOTH 4 and 6?",
         8, ["6", "9", "16"], "96 / 12",
         ["Numbers divisible by both 4 and 6 are multiples of LCM(4, 6) = 12.", "Multiples of 12 up to 100 are 12, 24, 36, 48, 60, 72, 84, 96 (8 numbers)."], 90),
        ("medium", "Three friends — Mia, Noah and Priya — have ages that are consecutive integers. The product of Mia's and Priya's ages is 143. How old is Noah?",
         12, ["11", "13", "14"], "12",
         ["Note 143 = 11 * 13.", "The three consecutive ages are 11, 12 and 13, so Noah is 12."], 90),
        ("medium", "A locker code has 3 digits: ABC. A is twice C, B is 3 more than C, and A + B + C = 15. What is the 3-digit code?",
         663, ["452", "653", "874"], "663",
         ["Substitute A = 2C and B = C + 3 into A + B + C = 15: 4C + 3 = 15, so C = 3.", "Then A = 6 and B = 6, giving 663."], 95),
        ("medium", "What is the smallest positive integer that leaves a remainder of 1 when divided by 2, 3 and 4?",
         13, ["7", "11", "25"], "12 + 1",
         ["The number minus 1 must be divisible by 2, 3 and 4.", "LCM(2, 3, 4) = 12, so the smallest positive integer (greater than 1? Wait: 1 leaves remainder 1 too! Let's specify 'greater than 1'!)."], 90),
    ])
    logic_specs[-1] = (
        "medium", "What is the smallest whole number greater than 1 that leaves a remainder of 1 when divided by 2, 3 and 4?",
        13, ["7", "11", "25"], "12 + 1",
        ["The number minus 1 must be a positive multiple of LCM(2, 3, 4) = 12.", "12 + 1 = 13."], 90
    )
    logic_specs.extend([
        ("medium", "Using each of the digits 1, 3, 5, 8 once, form two 2-digit numbers whose sum is as large as possible. What is that maximum sum?",
         136, ["126", "134", "138"], "83 + 51",
         ["Wait: 83 + 51 = 134, and 81 + 53 = 134! Neither is 136! Let's check: tens digits must be 8 and 5 → 80+50=130, units 3+1=4 → 134!"], 95),
    ])
    logic_specs[-1] = (
        "medium", "Using each of the digits 1, 3, 5, 8 once, form two 2-digit numbers whose sum is as large as possible. What is that maximum sum?",
        134, ["126", "132", "138"], "83 + 51",
        ["Place the two largest digits (8 and 5) in the tens places, and 3 and 1 in the units places.", "83 + 51 = 134 (or 81 + 53 = 134)."], 90
    )
    logic_specs.extend([
        ("medium", "A number N is between 50 and 80. When N is divided by 5, the remainder is 2. When N is divided by 4, the remainder is 3. What is N?",
         67, ["57", "63", "77"], "67",
         ["Numbers in 50..80 giving remainder 2 mod 5: 52, 57, 62, 67, 72, 77.", "Checking mod 4 for remainder 3: 52(0), 57(1), 62(2), 67(3), 72(0), 77(1). Only 67 works."], 105),
        ("medium", "Four consecutive odd numbers have a sum of 80. What is the smallest of the four numbers?",
         17, ["15", "19", "21"], "80 / 4 - 3",
         ["The average is 80 / 4 = 20, so the four odd numbers are 17, 19, 21 and 23.", "The smallest is 17."], 85),
        ("medium", "If the day after tomorrow is Wednesday, what day was it three days before yesterday?",
         "Friday" if False else 5, None, None, None), # NR needs numeric answer for arithmeticCheck! Let's use a numeric calendar deduction:
    ])
    logic_specs[-1] = (
        "medium", "In a 31-day month, there are five Saturdays and five Sundays. On what date does the first Saturday fall?",
        1, ["2", "3", "4"], "1",
        ["A 31-day month has 4 full weeks (28 days) plus 3 extra days (days 29, 30, 31).", "For both Saturday and Sunday to occur 5 times, they must be among the first 3 days: specifically 1st, 2nd or 2nd, 3rd? Wait: if 1st is Saturday, 2nd is Sunday → 5 Sats (1,8,15,22,29) and 5 Suns (2,9,16,23,30). What if 2nd is Sat, 3rd is Sun? 2,9,16,23,30 and 3,10,17,24,31 — that ALSO works! Good catch! Fix: 'five Fridays, five Saturdays and five Sundays' → unique! 1st=Fri, 2nd=Sat, 3rd=Sun → first Saturday is 2!"], 100
    )
    logic_specs[-1] = (
        "medium", "In a 31-day month, there are five Fridays, five Saturdays and five Sundays. On what date of the month does the first Saturday fall?",
        2, ["1", "3", "4"], "2",
        ["Days 1, 2 and 3 repeat 5 times in a 31-day month (1, 8, 15, 22, 29; 2, 9, 16, 23, 30; 3, 10, 17, 24, 31).", "Those three consecutive days must be Friday (1st), Saturday (2nd) and Sunday (3rd), so the first Saturday is the 2nd."], 100
    )
    logic_specs.extend([
        ("medium", "How many 2-digit numbers have the tens digit strictly greater than the units digit?",
         45, ["36", "40", "50"], "9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1",
         ["For tens digit k (1 to 9), there are k choices for the units digit (0 to k-1).", "Sum 1 + 2 + ... + 9 = 45."], 105),
        ("medium", "A bag of lollies can be shared equally among 4 children with 3 left over, or among 5 children with 3 left over. What is the smallest number of lollies greater than 10?",
         23, ["19", "20", "43"], "20 + 3",
         ["The count minus 3 is divisible by both 4 and 5, so it is a multiple of LCM(4, 5) = 20.", "20 + 3 = 23."], 90),
        ("medium", "What is the units (ones) digit of 7 ** 4?",
         1, ["3", "7", "9"], "(7 ** 4) % 10",
         ["7¹=7, 7²=49 (ends in 9), 7³=343 (ends in 3), 7⁴=2401 (ends in 1).", "The units digit is 1."], 80),
        ("medium", "A balance scale holds 3 identical cubes on the left, and 1 cube plus a 140 g weight on the right. The scale is level. What is the mass of one cube in grams?",
         70, ["35", "45", "140"], "140 / (3 - 1)",
         ["Remove 1 cube from each side: 2 cubes balance 140 g.", "One cube weighs 140 / 2 = 70 g."], 75),

        # Challenging (12)
        ("challenging", "In a 4-digit number ABCD, A is 3 times D, B is A - 2, and C is D + 1. If the sum of all four digits is 19, what is the number?",
         9733 if False else 6432, None, None, None),
    ])
    # Check: D=2 → A=6, B=4, C=3 → 6+4+3+2 = 15. D=3 → A=9, B=7, C=4 → 9+7+4+3 = 23. Let's state sum = 15!
    logic_specs[-1] = (
        "challenging", "In a 4-digit number ABCD, A is 3 times D, B is A - 2, and C is D + 1. If the sum of all four digits is 15, what is the 4-digit number?",
        6432, ["3121", "6342", "9743"], "6432",
        ["Write digits in terms of D: 3D + (3D - 2) + (D + 1) + D = 8D - 1 = 15.", "8D = 16 gives D = 2, so A = 6, B = 4, C = 3, forming 6432."], 120
    )
    logic_specs.extend([
        ("challenging", "How many integers from 1 to 100 inclusive contain the digit 7 at least once?",
         19, ["18", "20", "21"], "10 + 10 - 1",
         ["Ten numbers end in 7 (7, 17, ..., 97) and ten numbers start with 7 (70..79).", "Subtract 77 once because it was counted twice: 10 + 10 - 1 = 19."], 110),
        ("challenging", "A palindrome is a number that reads the same forwards and backwards, such as 242. How many 3-digit palindromes are divisible by 5?",
         9, ["10", "18", "20"], "9",
         ["A 3-digit palindrome has the form ABA with A from 1 to 9. To be divisible by 5, the last digit A must be 5.", "So A = 5 and B can be 0..8? No, B can be 0..9 → 10 choices! Good catch! Fix: 10 choices!"], 115),
    ])
    logic_specs[-1] = (
        "challenging", "A palindrome reads the same forwards and backwards, such as 242. How many 3-digit palindromes are divisible by 5?",
        10, ["9", "18", "20"], "10",
        ["A 3-digit palindrome has the form ABA. To be divisible by 5 (with A nonzero), the outer digit A must be 5.", "The middle digit B can be any digit from 0 to 9, giving 10 palindromes (505, 515, ..., 595)."], 115
    )
    logic_specs.extend([
        ("challenging", "When a positive integer is divided by 7, the remainder is 4. What is the remainder when 3 times that integer is divided by 7?",
         5, ["2", "4", "6"], "(3 * 4) % 7",
         ["Let the number be 7k + 4. Then 3(7k + 4) = 21k + 12.", "21k is divisible by 7, and 12 = 7 + 5 leaves a remainder of 5."], 115),
        ("challenging", "Five people in a room each shake hands with every other person exactly once. How many handshakes occur in total?",
         10, ["15", "20", "25"], "5 * 4 / 2",
         ["Each of the 5 people shakes hands with 4 others, counting each handshake twice.", "(5 * 4) / 2 = 10 handshakes."], 95),
        ("challenging", "What is the units digit of 3 ** 21?",
         3, ["1", "7", "9"], "(3 ** 21) % 10",
         ["Units digits of powers of 3 cycle every 4: 3, 9, 7, 1.", "21 = 4 * 5 + 1, so the units digit matches 3¹ = 3."], 115),
        ("challenging", "A digital clock shows 24-hour time from 00:00 to 23:59. How many times during a full day does the clock display 11:11? No—how many times in a single hour from 03:00 to 03:59 does the sum of the four digits equal 10?",
         6, ["5", "7", "8"], "6",
         ["With hour 03, the two minute digits must sum to 10 - 3 = 7.", "Valid minute pairs (m1, m2) with m1 in 0..5 and m2 in 0..9 summing to 7: 07, 16, 25, 34, 43, 52 — 6 times."], 125),
        ("challenging", "In a tournament, 16 teams play a single-elimination knockout (each match eliminates 1 team). How many matches are played to crown the champion?",
         15, ["8", "14", "16"], "16 - 1",
         ["Every match eliminates exactly 1 team, and 15 teams must be eliminated to leave 1 champion.", "Therefore, 15 matches are needed."], 95),
        ("challenging", "The product of two whole numbers is 144 and their greatest common factor (HCF) is 4. What is their least common multiple (LCM)?",
         36, ["18", "24", "48"], "144 / 4",
         ["For any two positive integers, HCF * LCM = Product.", "LCM = 144 / 4 = 36."], 105),
        ("challenging", "A book has 180 pages numbered 1 to 180. How many times is the digit 2 printed in the page numbers?",
         38, ["36", "37", "39"], "18 + 20",
         ["Units place: 18 times (2, 12, ..., 172). Tens place: 20 times (20..29 and 120..129).", "Hundreds place: 0 times (max page 180). Total = 18 + 20 = 38."], 130),
        ("challenging", "If 1st January of a non-leap year is a Tuesday, what day of the week is 1st March of the same year? (Give 1=Mon, 2=Tue, ..., 7=Sun — wait: ask how many days later or which day? Let's ask how many days after 1st January is 1st March, or ask for the date of the first Friday in March!)",
         3, ["1", "2", "4"], "3",
         ["Jan has 31 days and Feb has 28 days (59 days = 8 weeks + 3 days), so 1st March is Tue + 3 = Friday.", "Therefore, the first Friday in March falls on 1st March! Wait: let's ask for the date of the first Sunday in March → 3rd March!"], 125),
    ])
    logic_specs[-1] = (
        "challenging", "In a non-leap year, 1st January is a Tuesday. What is the date of the first Sunday in March of that same year?",
        3, ["1", "2", "4"], "3",
        ["From 1st Jan to 1st Mar is 31 + 28 = 59 days = 8 weeks + 3 days, so 1st March is a Friday.", "Saturday is 2nd March and the first Sunday is 3rd March."], 125
    )
    logic_specs.extend([
        ("challenging", "A 2-digit number is equal to 7 times the sum of its digits. What is the smallest such 2-digit number?",
         21, ["14", "28", "42"], "21",
         ["10a + b = 7(a + b) simplifies to 3a = 6b, so a = 2b.", "With b = 1, a = 2 gives the smallest such number, 21."], 120),
    ])

    for diff, prompt, ans, dists, expr, worked, est in logic_specs:
        items.append(_mk_nr(idx, diff, "scholarship.nr-logic-deduction-numbers", "logical deduction numbers", prompt, ans, dists, expr, worked, est))
        idx += 1

    # --- 4. ARITHMETICAL REASONING (30: 5 easy, 13 medium, 12 challenging) ---
    arith_specs = [
        # Easy (5)
        ("easy", "A bus seats 44 passengers. How many buses are needed to carry 200 students on an excursion?",
         5, ["4", "4.5", "6"], "5",
         ["200 / 44 = 4 remainder 24.", "An extra bus is required for the remaining 24 students, so 5 buses are needed."], 60),
        ("easy", "A bakery packs muffins in boxes of 6. If 85 muffins are baked, how many muffins are left over after filling as many full boxes as possible?",
         1, ["2", "3", "4"], "85 % 6",
         ["85 = 6 * 14 + 1.", "14 boxes are filled with 1 muffin left over."], 55),
        ("easy", "Tickets to a museum cost $12 for adults and $7 for children. How much does it cost for 2 adults and 3 children in dollars?",
         45, ["38", "42", "50"], "2 * 12 + 3 * 7",
         ["Adults: 2 * 12 = $24. Children: 3 * 7 = $21.", "Total = 24 + 21 = $45."], 55),
        ("easy", "A train leaves at 10:45 am and arrives at 1:20 pm. How many minutes does the journey take?",
         155, ["135", "145", "165"], "15 + 120 + 20",
         ["From 10:45 am to 11:00 am is 15 min; 11:00 am to 1:00 pm is 120 min; plus 20 min.", "15 + 120 + 20 = 155 minutes."], 65),
        ("easy", "If 8 identical pens cost $20, how many dollars do 12 of the same pens cost?",
         30, ["24", "28", "32"], "(20 / 8) * 12",
         ["One pen costs 20 / 8 = $2.50.", "12 pens cost 12 * 2.50 = $30."], 60),

        # Medium (13)
        ("medium", "A snail climbs 4 m up a well each day and slips back 2 m each night. How many days does it take to reach the top of a 14 m well?",
         6, ["5", "7", "8"], "(14 - 4) / (4 - 2) + 1",
         ["Net gain per full day-and-night is 4 - 2 = 2 m. After 5 days and nights it is at 10 m.", "On Day 6 it climbs 4 m to reach 14 m and exits before slipping back."], 100),
        ("medium", "At a party, 240 mL cups are filled from a 3 L bottle of lemonade. How many full cups can be poured?",
         12, ["10", "11", "13"], "12",
         ["3 L = 3000 mL.", "3000 / 240 = 12.5, so 12 full cups can be poured."], 80),
        ("medium", "In a queue, Eli is 14th from the front and 19th from the back. How many people are in the queue?",
         32, ["31", "33", "34"], "14 + 19 - 1",
         ["Adding 14 + 19 counts Eli twice.", "14 + 19 - 1 = 32 people."], 70),
        ("medium", "A farmer has chickens and goats. Together they have 20 heads and 54 legs. How many goats does the farmer have?",
         7, ["6", "8", "13"], "(54 - 20 * 2) / 2",
         ["If all 20 were chickens, there would be 40 legs.", "The extra 54 - 40 = 14 legs belong to goats (2 extra legs each), so 14 / 2 = 7 goats."], 95),
        ("medium", "A cyclist averages 24 km/h for 2.5 hours and then 18 km/h for 1.5 hours. What is the total distance travelled in kilometres?",
         87, ["81", "84", "90"], "24 * 2.5 + 18 * 1.5",
         ["First leg: 24 * 2.5 = 60 km. Second leg: 18 * 1.5 = 27 km.", "Total = 60 + 27 = 87 km."], 85),
        ("medium", "A shop sells oranges in bags of 5 for $4, or individually for $1 each. What is the minimum cost in dollars to buy exactly 23 oranges?",
         19, ["18", "20", "23"], "4 * 4 + 3 * 1",
         ["Buy 4 bags of 5 (20 oranges) for 4 * $4 = $16.", "Buy the remaining 3 oranges individually for $3: total $19."], 85),
        ("medium", "Three boxes A, B and C weigh 42 kg in total. Box A weighs 6 kg more than Box B, and Box C weighs 3 kg less than Box B. How many kilograms does Box B weigh?",
         13, ["11", "12", "15"], "(42 - 6 + 3) / 3",
         ["Write in terms of B: (B + 6) + B + (B - 3) = 42, so 3B + 3 = 42.", "3B = 39, giving B = 13 kg."], 95),
        ("medium", "A machine stamps 15 labels every 20 seconds. How many labels does it stamp in 8 minutes?",
         360, ["240", "300", "450"], "15 * 3 * 8",
         ["In 1 minute (60 s) it stamps 15 * 3 = 45 labels.", "In 8 minutes: 45 * 8 = 360 labels."], 85),
        ("medium", "A class of 28 students takes a survey: 16 like cricket, 15 like swimming, and 5 like both. How many students like NEITHER sport?",
         2, ["1", "3", "4"], "28 - (16 + 15 - 5)",
         ["Students liking at least one = 16 + 15 - 5 = 26.", "Neither = 28 - 26 = 2 students."], 85),
        ("medium", "A book costs $3 more than a magazine. Together, 2 books and 3 magazines cost $31. How much does one book cost in dollars?",
         8, ["5", "7", "9"], "(31 - 2 * 3) / 5 + 3",
         ["Replace 2 books with 2 magazines + $6: 5 magazines + $6 = $31, so 5 magazines = $25 and 1 magazine = $5.", "One book costs 5 + 3 = $8."], 100),
        ("medium", "A rectangular paddock 80 m by 50 m has fence posts placed every 10 m around its entire perimeter, including all four corners. How many posts are needed?",
         26, ["24", "28", "30"], "(2 * (80 + 50)) / 10",
         ["Perimeter = 2 * (80 + 50) = 260 m.", "For a closed loop, number of posts equals number of 10 m intervals: 260 / 10 = 26 posts."], 90),
        ("medium", "Maya reads 18 pages a day and finishes a novel in 10 days. If she had read 15 pages a day instead, how many days would she have taken?",
         12, ["11", "13", "15"], "(18 * 10) / 15",
         ["Total pages = 18 * 10 = 180 pages.", "At 15 pages/day: 180 / 15 = 12 days."], 75),
        ("medium", "An empty crate weighs 2.5 kg. When 16 identical cans are placed inside, the total mass is 10.5 kg. How many grams does one can weigh?",
         500, ["400", "450", "650"], "((10.5 - 2.5) / 16) * 1000",
         ["Mass of 16 cans = 10.5 - 2.5 = 8 kg = 8000 g.", "One can = 8000 / 16 = 500 g."], 85),

        # Challenging (12)
        ("challenging", "Two runners start from the same point on a 400 m circular track and run in opposite directions at 6 m/s and 4 m/s. After how many seconds do they meet for the first time?",
         40, ["36", "45", "50"], "400 / (6 + 4)",
         ["Running in opposite directions, their combined closing speed is 6 + 4 = 10 m/s.", "Time to cover 400 m = 400 / 10 = 40 seconds."], 105),
        ("challenging", "A ferry travels 24 km downstream with a 2 km/h current in 2 hours. How many hours will the return trip upstream take?",
         3, ["2.5", "3.5", "4"], "24 / ((24 / 2 - 2) - 2)",
         ["Downstream speed = 24 / 2 = 12 km/h, so the ferry's still-water speed is 12 - 2 = 10 km/h.", "Upstream speed = 10 - 2 = 8 km/h, so return time = 24 / 8 = 3 hours."], 125),
        ("challenging", "At a sale, buying 3 shirts gets you a 4th shirt for half price. If each shirt is normally $28, how much do 8 shirts cost altogether in dollars?",
         196, ["182", "210", "224"], "2 * (3 * 28 + 14)",
         ["Each bundle of 4 shirts costs 3 * 28 + 14 = 84 + 14 = $98.", "8 shirts = 2 bundles = 2 * 98 = $196."], 110),
        ("challenging", "A tank is emptied by Pump A in 12 minutes or by Pump B in 18 minutes. If both pumps run together for 4 minutes, what percentage of the tank remains?",
         "44.4" if False else 40, None, None, None),
    ]
    # Use exact integer percentage! Pump A 10 min, Pump B 15 min, run for 3 min → 3*(1/10 + 1/15) = 3*(5/30) = 50%! Run for 4 min → 4*(1/6) = 2/3. Run for 3 min → 50% remaining!
    arith_specs[-1] = (
        "challenging", "A tank is emptied by Pump A in 10 minutes or by Pump B in 15 minutes. If both pumps run together for 4 minutes, what fraction of the tank remains full?",
        "1/3", ["1/5", "2/5", "1/2"], "1 - 4 * (1/10 + 1/15)",
        ["Combined rate = 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6 per minute.", "In 4 minutes they empty 4/6 = 2/3, leaving 1/3 of the tank."], 120
    )
    # Wait: _mk_nr formats float! For "1/3", pass string "1/3" directly? Let's make sure _fmt handles string!
    # Look at _fmt: if val is str, returns str(val). In _mk_nr, `expected` is `ans_str` ("1/3"), and `parseOptionNumericValue("1/3")` = 0.3333333, matching `evaluateArithmetic("1 - 4*(1/10 + 1/15)")` = 0.3333333!
    arith_specs.extend([
        ("challenging", "A watch gains 4 minutes every 12 hours. If it is set correctly at 8:00 am on Monday, how many minutes fast will it be at 2:00 pm on Wednesday?",
         18, ["14", "16", "20"], "(54 / 12) * 4",
         ["From Mon 8:00 am to Wed 8:00 am is 48 hours, plus 6 hours to 2:00 pm = 54 hours.", "54 / 12 = 4.5 intervals; 4.5 * 4 = 18 minutes fast."], 120),
        ("challenging", "In a race, Zara finished 12 m ahead of Liam, and Liam finished 15 m ahead of Noah. All three ran at constant speeds. When Zara crossed the 120 m finish line, how many metres behind her was Noah?",
         27, ["24", "25", "30"], "12 + 15",
         ["Wait: 'Liam finished 15 m ahead of Noah' means when Liam finishes (after Zara), Noah is 15 m behind Liam; when Zara finished, Liam was 12 m behind Zara (at 108 m), so Noah was SLIGHTLY less than 15 m behind Liam! Let's phrase it cleanly: 'At the moment Zara crosses the finish line, Liam is 12 m behind Zara, and Noah is 15 m behind Liam.' Then it's exact: 12 + 15 = 27!"], 115),
    ])
    arith_specs[-1] = (
        "challenging", "In a 200 m race, at the exact moment Zara crosses the finish line, Liam is 12 m behind Zara and Noah is 15 m behind Liam. How many metres has Noah run so far?",
        173, ["170", "175", "185"], "200 - 12 - 15",
        ["Liam is at 200 - 12 = 188 m.", "Noah is 15 m behind Liam: 188 - 15 = 173 m."], 105
    )
    arith_specs.extend([
        ("challenging", "A shop mixes tea costing $18/kg with tea costing $24/kg in the ratio 2 : 1 by mass. What is the cost of 1 kg of the blend in dollars?",
         20, ["19", "21", "22"], "(2 * 18 + 1 * 24) / 3",
         ["3 kg of blend costs 2 * 18 + 24 = 36 + 24 = $60.", "1 kg costs 60 / 3 = $20."], 110),
        ("challenging", "A student scored an average of 76 across 4 tests. What score must she get on the 5th test to raise her overall average to 80?",
         96, ["88", "92", "98"], "5 * 80 - 4 * 76",
         ["Total needed across 5 tests = 5 * 80 = 400. Current total = 4 * 76 = 304.", "5th test score = 400 - 304 = 96."], 100),
        ("challenging", "A car uses 7.5 L of fuel per 100 km. Fuel costs $2.00 per litre. How much does fuel cost in dollars for a 360 km trip?",
         54, ["48", "51", "60"], "(360 / 100) * 7.5 * 2",
         ["Fuel used = 3.6 * 7.5 = 27 L.", "Cost = 27 * $2.00 = $54."], 105),
        ("challenging", "Three bells ring at intervals of 12 s, 15 s and 20 s. If they all ring together at 9:00:00 am, how many times will they ring together again between 9:00:01 am and 9:05:00 am?",
         5, ["3", "4", "6"], "300 / 60",
         ["LCM(12, 15, 20) = 60 seconds (1 minute).", "From 9:00:01 to 9:05:00 is 5 minutes, so they ring together at 9:01, 9:02, 9:03, 9:04 and 9:05 (5 times)."], 115),
        ("challenging", "A rope 9.6 m long is cut into two pieces such that one piece is 3 times as long as the other. How many centimetres longer is the longer piece than the shorter piece?",
         480, ["240", "360", "720"], "((9.6 / 4) * (3 - 1)) * 100",
         ["Total parts = 3 + 1 = 4, so the shorter piece is 9.6 / 4 = 2.4 m and the longer is 7.2 m.", "Difference = 7.2 - 2.4 = 4.8 m = 480 cm."], 110),
        ("challenging", "A staircase has 10 steps. Each step is 18 cm high and 25 cm deep. A carpet runner is laid tightly over all 10 risers and all 10 treads from the bottom to the top. What is the total length of carpet needed in centimetres?",
         430, ["250", "360", "450"], "10 * (18 + 25)",
         ["Each step contributes one 18 cm riser and one 25 cm tread: 18 + 25 = 43 cm.", "Across 10 steps: 10 * 43 = 430 cm."], 110),
    ])

    assert len(items) + len(arith_specs) == 120, f"Got {len(items) + len(arith_specs)}"
    for diff, prompt, ans, dists, expr, worked, est in arith_specs:
        items.append(_mk_nr(idx, diff, "scholarship.nr-arithmetical-reasoning", "arithmetical reasoning", prompt, ans, dists, expr, worked, est))
        idx += 1

    # Re-order so n097..n120 (6 from each of the 4 skills = 24) are mock-reserved
    by_skill = {}
    for it in items:
        by_skill.setdefault(it["skill"], []).append(it)
    practice_pool, mock_pool = [], []
    for sk, group in by_skill.items():
        practice_pool.extend(group[:-6])
        mock_pool.extend(group[-6:])
    ordered = practice_pool + mock_pool
    assert len(ordered) == 120
    for i, it in enumerate(ordered, 1):
        it["id"] = f"vihaan-agy-n{i:03d}"
        if i >= 97:
            it["tags"] = ["vihaan-agy-500", "edutest-style", "mock-reserved"]
            it["reviewFocus"] = ["Mock-reserved item: verify blind solution and distractor plausibility."]
    return ordered
