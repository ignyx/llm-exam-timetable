% MiniZinc model for Generalized Thesis Defense Scheduling Problem - Final Version

% Parameters from data file
int: J;  % Number of juries
int: S;  % Number of slots per jury
int: C;  % Capacity per slot
int: N;  % Number of students
int: K;  % Number of companies
int: A;  % Number of advisors

% Data arrays
array[1..N] of int: student_jury;      % Jury assignment for each student
array[1..N] of int: student_company;   % Company for each student
array[1..N] of int: student_advisor;   % Advisor for each student
int: num_incompatible_pairs; % Number of incompatible company pairs
array[1..num_incompatible_pairs] of int: incompatible_pairs_c1; % First company in each incompatible pair
array[1..num_incompatible_pairs] of int: incompatible_pairs_c2; % Second company in each incompatible pair

% Decision variables
array[1..J, 1..S, 1..N] of var bool: schedule; % schedule[j,s,n] = true if student n is scheduled in jury j, slot s
array[1..A, 1..J, 1..S] of var bool: advisor_present; % advisor_present[a,j,s] = true if advisor a is present in jury j, slot s

% Constraints

% 1. Single defense per student - each student scheduled exactly once in their assigned jury
constraint forall(n in 1..N)(sum(s in 1..S)(schedule[student_jury[n], s, n]) = 1);

% 2. Slot capacity - no more than C defenses per slot
constraint forall(j in 1..J, s in 1..S)(sum(n in 1..N)(schedule[j, s, n]) <= C);

% 3. Advisor capacity - advisor must be present for their students' defenses
constraint forall(a in 1..A, j in 1..J, s in 1..S, n in 1..N where student_advisor[n] == a)(schedule[j, s, n] -> advisor_present[a, j, s]);

% 4. Company incompatibility - incompatible companies cannot be in same slot
constraint forall(j in 1..J, s in 1..S, n1 in 1..N, n2 in 1..N where n1 < n2)(
    schedule[j, s, n1] /\ 
    schedule[j, s, n2] /\ 
    (exists(k in 1..num_incompatible_pairs)( 
        (student_company[n1] == incompatible_pairs_c1[k] /\ student_company[n2] == incompatible_pairs_c2[k]) \/
        (student_company[n1] == incompatible_pairs_c2[k] /\ student_company[n2] == incompatible_pairs_c1[k])
    )) -> false
);

% 5. Advisor availability - advisor can be in at most 2 slots per jury (more realistic)
constraint forall(a in 1..A, j in 1..J)(sum(s in 1..S)(advisor_present[a, j, s]) <= 2);

% Objective: Minimize total advisor presence (to reduce advisor workload)
var int: total_advisor_presence = sum([bool2int(advisor_present[a, j, s]) | a in 1..A, j in 1..J, s in 1..S]);

solve minimize total_advisor_presence;

% Output
output [
    "Schedule:\n"
] ++
["Jury " ++ show(j) ++ ", Slot " ++ show(s) ++ ": " ++ 
 show([n | n in 1..N where fix(schedule[j, s, n])]) ++ "\n" | 
 j in 1..J, s in 1..S] ++
[
    "\nAdvisor presence:\n"
] ++
["Advisor " ++ show(a) ++ " present in: " ++ 
 show([(j, s) | j in 1..J, s in 1..S where fix(advisor_present[a, j, s])]) ++ "\n" | 
 a in 1..A] ++
[
    "\nTotal advisor presence: " ++ show(total_advisor_presence) ++ "\n"
];