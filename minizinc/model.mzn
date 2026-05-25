%! -- INTERN PARAMETERS -- 

set of int: Sessions = 1..3;
set of int: Positions = 1..3;
 

%! -- EXTERN PARAMETERS --  
% Constants
int: nbStud;
int: nbPT;
int: nbSpe; 
int: nbRoom;
int: nbIT;
int: nbDay;
int: nbCompany;


% Sets 
set of int: Students = 1..nbStud;
set of int: PTutors = 1..nbPT;
set of int: ITutors = 1..nnIT;
set of int: Rooms = 1..nbRoom;
set of int: Days = 1..nbDay;
set of int: Spe = 1..nbSpe;
set of int: Companies = 1..nbCompany;

%Arrays of correspondances
array[Students] of int: studentsPT;
array[Students] of int: studentsIT;
array[Students] of int: studentsSpe;
array[Students] of int: studentsCpn;

array[int] of record(int: cpn1, int: cpn2): IncompatiblesPairs;

%Arrays of Availabilities
array[PTutors, Days, Sessions] of bool: PTAvail;
array[ITutors, Days, Sessions] of bool: ITAvail;

array[Spe, Days] of bool: SpeAvail_perDay;

%! -- DECISION VARIABLES -- 

array[Students] of var Rooms: room;
array[Students] of var Days: day;
array[Students] of var Sessions: session;
array[Students] of var Positions: position;


%! -- PREDICATES --
predicate sameSession(int: i, int: j) =
    day[i] == day[j] /\ 
    session[i] == session[j];

predicate sameTime(int: i, int: j) =
    day[i] == day[j] /\ 
    session[i] == session[j] /\ 
    position[i] == position[j];

predicate present(int: e, int: j, int: s, int: p) = 
    day[e] == j /\ session[e] == s /\ position[e] == p; 

%! -- CONSTRAINTS -- 

% A specific time slot and room cannot host two students.
constraint forall(i, j in Students where i < j) (
    (sameTime(i, j)) -> (room[i] != room[j])
);

% The morning session hosts four students, and three for the two other sessions.
constraint forall(e in Students) (
    (session[e] >= 2) -> (position[e] <= 3)
);

% A session hosts only students with the same specialty.
% Students with the same specialty are in the same room, for a given session.
constraint forall(e, f in Students where e < f)(
    (day[e] == day[f] /\ session[e] == session[f]) 
    -> (studentsSpe[e] == studentsSpe[f] <-> room[e] == room[f])
);

% Academic tutors must be present for their students' defense
constraint forall(e, f in Students where e > f /\ studentsSpe[e] == studentsSpe[f])(
    sameTime(e, f) -> (room[e] == room[f])
);

% Availability of the specialty presidents
constraint forall(e in Students) (
    SpeAvail_perDay[studentsSpe[e], day[e]]
);

% Availability of the academic tutors
constraint forall(e in Students) (
    PTAvail[studentsPT[e], day[e], session[e]]
);

% Students from competing companies cannot be in the same session.
constraint forall(e, f in Students where e < f, c in IncompatiblesPairs 
    where (c.cpn1 == studentsCpn[e] /\ c.cpn2 == studentsCpn[f]) \/ 
          (c.cpn1 == studentsCpn[f] /\ c.cpn2 == studentsCpn[e])
)(
    not(day[e] == day[f] /\ session[e] == session[f])
);

% Availability of the industrial tutors
var int: ITAvail;
constraint ITAvail = sum(e in Students) (
    2*bool2int(ITAvail[studentsIT[e], day[e], session[e]])
);

var int: PairsStudents;
var int: MoreThanPairsStudents;

% Pair students up for a session, if possible.
constraint PairsStudents = sum(e, f in Students where e < f and studentsPT[e] == studentsPT[f]) (
    5*bool2int(sameSession(e, f))
);
% More than 2 students with the same tutor in the same session is not good, we penalize it a lot.
constraint MoreThanPairsStudents = sum(e, f, g in Students where e < f and f < g and studentsPT[e] == studentsPT[f] and studentsPT[f] == studentsPT[g]) (
    -30*bool2int(sameSession(e, f) and sameSession(f, g))
);

%  Failure to attend an entire session will result in a penalty.
var int: entireSessionPresence;
constraint entireSessionPresence = sum(e, f in Students where e > f /\ studentsPT[e] == studentsPT[f])(
    -1000*bool2int(sameSession(e, f) /\ room[e] != room[f])
);

var int : finalScore;
constraint finalScore = PairsStudents + MoreThanPairsStudents + entireSessionPresence + ITAvail;

%! -- Objective --
solve  maximize finalScore;