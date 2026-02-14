
import copy

# Mapping from screenshot (1693 / 1781)
u_face = [['B','B','B'], ['B','W','G'], ['G','G','G']]
l_face = [['R','R','R'], ['W','O','Y'], ['R','R','R']]
f_face = [['W','W','W'], ['O','G','R'], ['Y','Y','Y']]
r_face = [['O','O','O'], ['W','R','Y'], ['O','O','O']]
b_face = [['W','W','W'], ['R','B','O'], ['Y','Y','Y']]
d_face = [['G','G','G'], ['G','Y','B'], ['B','B','B']]

# Apply Mirror to B Face (Left <-> Right)
# Original B:
# W W W
# R B O
# Y Y Y
#
# Mirrored B:
# W W W
# O B R
# Y Y Y
b_face_mirrored = [row[::-1] for row in b_face]

# Test: Use Mirrored B? Or standard?
# Hypothesis: Solver expects standard input, but got standard input?
# Wait. If Solver expects MIRRORED input, and I gave it STANDARD.
# Then Solver solves STANDARD.
# And returns 14 moves.
# My simulation applies 14 moves to STANDARD. And gets Almost Solved.
# This implies 14 moves WORKS for STANDARD?
# No.
# If Solver solves STANDARD, then 14 moves should solve STANDARD.
# My simulation shows it DOES NOT solve STANDARD.
# This implies Solver and Simulation disagree on what moves mean?
# OR Solver and Simulation disagree on Facelet Order?
# OR Solver and Simulation disagree on Solved State?

# Let's test if 14 moves solves MIRRORED B.
# If yes, then the 14 moves assume B is Mirrored.
# This means Solver *Input* was interpreted as Mirrored B?
# If I passed Standard B.
# Did Solver Interpret it as Mirrored?
# Only if Solver reads indices differently (e.g. 2,1,0 instead of 0,1,2).

# Let's try simulating with Mirrored B.
cube = {
    'U': copy.deepcopy(u_face),
    'L': copy.deepcopy(l_face),
    'F': copy.deepcopy(f_face),
    'R': copy.deepcopy(r_face),
    'B': b_face_mirrored, # Testing Mirror B
    'D': copy.deepcopy(d_face)
}

# The 14-move solution from Screenshot 1781
solution = "F B R L U' D' R2 U2 D2 F2 B2 R2 F2 B2"

def rotate_face_cw(face_grid):
    return [list(row) for row in zip(*face_grid[::-1])]

def rotate_face_ccw(face_grid):
    return [list(row) for row in zip(*face_grid)][::-1]

def rotate_face_180(face_grid):
    return rotate_face_cw(rotate_face_cw(face_grid))

def move_u(c):
    c['U'] = rotate_face_cw(c['U'])
    f_row = copy.deepcopy(c['F'][0])
    l_row = copy.deepcopy(c['L'][0])
    b_row = copy.deepcopy(c['B'][0])
    r_row = copy.deepcopy(c['R'][0])
    c['L'][0] = f_row
    c['B'][0] = l_row
    c['R'][0] = b_row
    c['F'][0] = r_row

def move_d(c):
    c['D'] = rotate_face_cw(c['D'])
    f_row = copy.deepcopy(c['F'][2])
    r_row = copy.deepcopy(c['R'][2])
    b_row = copy.deepcopy(c['B'][2])
    l_row = copy.deepcopy(c['L'][2])
    c['R'][2] = f_row
    c['B'][2] = r_row
    c['L'][2] = b_row
    c['F'][2] = l_row

def move_f(c):
    c['F'] = rotate_face_cw(c['F'])
    u_row = copy.deepcopy(c['U'][2])
    r_col = [row[0] for row in c['R']]
    d_row = copy.deepcopy(c['D'][0])
    l_col = [row[2] for row in c['L']]
    for i in range(3): c['R'][i][0] = u_row[i]
    for i in range(3): c['D'][0][2-i] = r_col[i]
    for i in range(3): c['L'][i][2] = d_row[i]
    for i in range(3): c['U'][2][2-i] = l_col[i]

def move_b(c):
    c['B'] = rotate_face_cw(c['B'])
    u_row = copy.deepcopy(c['U'][0])
    l_col = [row[0] for row in c['L']]
    d_row = copy.deepcopy(c['D'][2])
    r_col = [row[2] for row in c['R']]
    for i in range(3): c['L'][2-i][0] = u_row[i]
    for i in range(3): c['D'][2][i] = l_col[i]
    for i in range(3): c['R'][2-i][2] = d_row[i]
    for i in range(3): c['U'][0][i] = r_col[i]

def move_r(c):
    c['R'] = rotate_face_cw(c['R'])
    u_col = [row[2] for row in c['U']]
    b_colinv = [row[0] for row in c['B']]
    d_col = [row[2] for row in c['D']]
    f_col = [row[2] for row in c['F']]
    for i in range(3): c['B'][2-i][0] = u_col[i]
    for i in range(3): c['D'][2-i][2] = b_colinv[i]
    for i in range(3): c['F'][i][2] = d_col[i]
    for i in range(3): c['U'][i][2] = f_col[i]

def move_l(c):
    c['L'] = rotate_face_cw(c['L'])
    u_col = [row[0] for row in c['U']]
    f_col = [row[0] for row in c['F']]
    d_col = [row[0] for row in c['D']]
    b_colinv = [row[2] for row in c['B']]
    for i in range(3): c['F'][i][0] = u_col[i]
    for i in range(3): c['D'][i][0] = f_col[i]
    for i in range(3): c['B'][2-i][2] = d_col[i]
    for i in range(3): c['U'][2-i][0] = b_colinv[i]

def apply_moves(moves_str):
    moves = moves_str.split()
    for m in moves:
        if m == "D'":
            for _ in range(3): move_d(cube)
        elif m == 'B':
            move_b(cube)
        elif m == 'D':
            move_d(cube)
        elif m == 'L2':
            move_l(cube); move_l(cube)
        elif m == 'F':
            move_f(cube)
        elif m == "R'":
            for _ in range(3): move_r(cube)
        elif m == 'D2':
            move_d(cube); move_d(cube)
        elif m == "L'":
            for _ in range(3): move_l(cube)
        elif m == "U'":
            for _ in range(3): move_u(cube)
        elif m == 'L':
            move_l(cube)
        elif m == 'U2':
            move_u(cube); move_u(cube)
        elif m == 'B2':
            move_b(cube); move_b(cube)
        elif m == 'R2':
            move_r(cube); move_r(cube)
        elif m == 'F2':
            move_f(cube); move_f(cube)
        elif m == 'U':
            move_u(cube)

apply_moves(solution)

print("Final State:")
for f in ['U','F','R','B','L','D']:
    print(f"{f}:")
    for r in cube[f]: print(r)

def is_face_solved(f, color):
    return all(c == color for row in f for c in row)

solved = (is_face_solved(cube['U'], 'W') and 
          is_face_solved(cube['F'], 'G') and
          is_face_solved(cube['R'], 'R') and 
          is_face_solved(cube['B'], 'B') and
          is_face_solved(cube['L'], 'O') and 
          is_face_solved(cube['D'], 'Y'))

print(f"Solved: {solved}")
