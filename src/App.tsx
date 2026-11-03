import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Compass,
  Calculator,
  Target,
  Trophy,
  BarChart3,
  Home,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Award,
  Flame,
  Lightbulb,
  HelpCircle,
  Play,
  Layers,
  Sliders,
  Eye,
  Check,
  X,
  RefreshCw,
  GraduationCap,
  Zap,
  Info,
  ZoomIn,
  ZoomOut,
  Crosshair,
  ShieldCheck,
  TrendingUp,
  Menu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line
} from 'recharts';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ModuleId = 'dashboard' | 'learn' | 'lab' | 'solver' | 'practice' | 'arena' | 'assessment';

type SolutionType = 'unique' | 'none' | 'infinite' | 'degenerate';

interface LinearSystem {
  a1: number;
  b1: number;
  c1: number;
  a2: number;
  b2: number;
  c2: number;
}

interface SystemAnalysis {
  type: SolutionType;
  consistency: 'Consistent (Independent)' | 'Consistent (Dependent)' | 'Inconsistent' | 'Invalid / Degenerate';
  geometry: 'Intersecting Lines' | 'Parallel Lines' | 'Coincident Lines' | 'Degenerate Equation';
  intersection: { x: number; y: number } | null;
  det: number;
  dx: number;
  dy: number;
  ratioA: string;
  ratioB: string;
  ratioC: string;
  ratioRelation: string;
  slope1: string;
  slope2: string;
  yInt1: string;
  yInt2: string;
  xInt1: string;
  xInt2: string;
  explanation: string;
}

interface AssessmentAttempt {
  id: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  topicScores: Record<string, { correct: number; total: number }>;
}

interface StudentProgress {
  studentName: string;
  completedConcepts: string[];
  labPresetsExplored: string[];
  solverMethodsUsed: string[];
  practiceSolvedIds: string[];
  practiceAttempts: number;
  arenaPoints: number;
  arenaStreak: number;
  arenaBestStreak: number;
  dailyChallengeCompleted: boolean;
  unlockedBadges: string[];
  assessmentAttempts: AssessmentAttempt[];
}

interface PracticeQuestion {
  id: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'MCQ' | 'Numerical' | 'Graph' | 'Conceptual';
  topic: string;
  prompt: string;
  equationPair?: LinearSystem;
  options?: string[];
  correctAnswer: string;
  numericTolerance?: number;
  hint: string;
  misconceptionDiagnosis: Record<string, string>;
  defaultDiagnosis: string;
  stepByStepSolution: string[];
}

// ============================================================================
// MATHEMATICAL ENGINE & HELPER UTILITIES
// ============================================================================

const EPSILON = 1e-9;

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a * 100));
  let y = Math.abs(Math.round(b * 100));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0 ? 1 : x;
}

export function formatNumber(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return 'Undefined';
  if (Math.abs(n) < EPSILON) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-7) return String(Math.round(n));
  return Number(n.toFixed(decimals)).toString();
}

export function formatFraction(num: number, den: number): string {
  if (Math.abs(den) < EPSILON && Math.abs(num) < EPSILON) return '0 / 0 (Indeterminate)';
  if (Math.abs(den) < EPSILON) return `${formatNumber(num)} / 0 (Undefined)`;
  if (Math.abs(num) < EPSILON) return '0';
  const sign = (num < 0) !== (den < 0) ? '-' : '';
  const absN = Math.abs(num);
  const absD = Math.abs(den);
  const g = gcd(absN, absD);
  const simpN = Math.round((absN * 100) / g);
  const simpD = Math.round((absD * 100) / g);
  const dec = formatNumber(num / den, 2);
  if (simpD === 1) return `${sign}${simpN}`;
  return `${sign}${simpN}/${simpD} (${dec})`;
}

export function formatLinearEquation(a: number, b: number, c: number): string {
  const parts: string[] = [];
  if (Math.abs(a) >= EPSILON) {
    const coeff = Math.abs(a) === 1 ? (a < 0 ? '-' : '') : formatNumber(a);
    parts.push(`${coeff}x`);
  }
  if (Math.abs(b) >= EPSILON) {
    const absB = Math.abs(b) === 1 ? '' : formatNumber(Math.abs(b));
    if (parts.length === 0) {
      parts.push(`${b < 0 ? '-' : ''}${absB}y`);
    } else {
      parts.push(`${b < 0 ? '- ' : '+ '}${absB}y`);
    }
  }
  if (parts.length === 0) {
    parts.push('0x + 0y');
  }
  return `${parts.join(' ')} = ${formatNumber(c)}`;
}

export function analyzeLinearSystem(sys: LinearSystem): SystemAnalysis {
  const { a1, b1, c1, a2, b2, c2 } = sys;

  const line1Degenerate = Math.abs(a1) < EPSILON && Math.abs(b1) < EPSILON;
  const line2Degenerate = Math.abs(a2) < EPSILON && Math.abs(b2) < EPSILON;

  const slope1 = Math.abs(b1) < EPSILON ? 'Vertical (∞)' : formatNumber(-a1 / b1, 2);
  const slope2 = Math.abs(b2) < EPSILON ? 'Vertical (∞)' : formatNumber(-a2 / b2, 2);
  const yInt1 = Math.abs(b1) < EPSILON ? 'None' : `(0, ${formatNumber(c1 / b1, 2)})`;
  const yInt2 = Math.abs(b2) < EPSILON ? 'None' : `(0, ${formatNumber(c2 / b2, 2)})`;
  const xInt1 = Math.abs(a1) < EPSILON ? 'None' : `(${formatNumber(c1 / a1, 2)}, 0)`;
  const xInt2 = Math.abs(a2) < EPSILON ? 'None' : `(${formatNumber(c2 / a2, 2)}, 0)`;

  const ratioA = formatFraction(a1, a2);
  const ratioB = formatFraction(b1, b2);
  const ratioC = formatFraction(c1, c2);

  if (line1Degenerate || line2Degenerate) {
    return {
      type: 'degenerate',
      consistency: 'Invalid / Degenerate',
      geometry: 'Degenerate Equation',
      intersection: null,
      det: 0,
      dx: 0,
      dy: 0,
      ratioA,
      ratioB,
      ratioC,
      ratioRelation: 'a² + b² = 0 (Violates linear condition)',
      slope1,
      slope2,
      yInt1,
      yInt2,
      xInt1,
      xInt2,
      explanation:
        'At least one equation has both x and y coefficients equal to zero (0x + 0y = c). For a valid linear equation in two variables, a and b cannot both be zero simultaneously (a² + b² ≠ 0).'
    };
  }

  const det = a1 * b2 - a2 * b1;
  const dx = c1 * b2 - c2 * b1;
  const dy = a1 * c2 - a2 * c1;

  if (Math.abs(det) > EPSILON) {
    const x = dx / det;
    const y = dy / det;
    return {
      type: 'unique',
      consistency: 'Consistent (Independent)',
      geometry: 'Intersecting Lines',
      intersection: { x, y },
      det,
      dx,
      dy,
      ratioA,
      ratioB,
      ratioC,
      ratioRelation: 'a₁/a₂ ≠ b₁/b₂',
      slope1,
      slope2,
      yInt1,
      yInt2,
      xInt1,
      xInt2,
      explanation: `Because a₁b₂ - a₂b₁ = ${formatNumber(det)} ≠ 0 (meaning a₁/a₂ ≠ b₁/b₂), the two lines have different slopes (${slope1} vs ${slope2}). Therefore, they cross at exactly one unique point (${formatNumber(x)}, ${formatNumber(y)}).`
    };
  }

  // Determinant is 0 -> lines have equal slopes (parallel or coincident)
  // Check whether (a1, b1, c1) and (a2, b2, c2) are proportional including c
  const crossAC = a1 * c2 - a2 * c1;
  const crossBC = b1 * c2 - b2 * c1;

  if (Math.abs(crossAC) < EPSILON && Math.abs(crossBC) < EPSILON) {
    return {
      type: 'infinite',
      consistency: 'Consistent (Dependent)',
      geometry: 'Coincident Lines',
      intersection: null,
      det: 0,
      dx: 0,
      dy: 0,
      ratioA,
      ratioB,
      ratioC,
      ratioRelation: 'a₁/a₂ = b₁/b₂ = c₁/c₂',
      slope1,
      slope2,
      yInt1,
      yInt2,
      xInt1,
      xInt2,
      explanation:
        'Every coefficient ratio is equal (a₁/a₂ = b₁/b₂ = c₁/c₂). Equation 2 is an exact scalar multiple of Equation 1, so both equations describe the exact same straight line. Every point on the line satisfies both equations, yielding infinitely many solutions.'
    };
  }

  return {
    type: 'none',
    consistency: 'Inconsistent',
    geometry: 'Parallel Lines',
    intersection: null,
    det: 0,
    dx,
    dy,
    ratioA,
    ratioB,
    ratioC,
    ratioRelation: 'a₁/a₂ = b₁/b₂ ≠ c₁/c₂',
    slope1,
    slope2,
    yInt1,
    yInt2,
    xInt1,
    xInt2,
    explanation: `The x and y coefficients are proportional (a₁/a₂ = b₁/b₂), giving both lines the exact same slope (${slope1}), but the constant ratio c₁/c₂ differs. The lines are parallel with distinct intercepts and never meet, so the system has no solution.`
  };
}

// Compute two boundary points to draw a line a*x + b*y = c across [-range, range]
function computeLineSegment(
  a: number,
  b: number,
  c: number,
  range: number
): [{ x: number; y: number }, { x: number; y: number }] | null {
  if (Math.abs(a) < EPSILON && Math.abs(b) < EPSILON) return null;
  const pts: { x: number; y: number }[] = [];

  if (Math.abs(b) > EPSILON) {
    const yLeft = (c - a * -range) / b;
    if (yLeft >= -range && yLeft <= range) pts.push({ x: -range, y: yLeft });
    const yRight = (c - a * range) / b;
    if (yRight >= -range && yRight <= range) pts.push({ x: range, y: yRight });
  }

  if (Math.abs(a) > EPSILON) {
    const xBottom = (c - b * -range) / a;
    if (xBottom > -range && xBottom < range) pts.push({ x: xBottom, y: -range });
    const xTop = (c - b * range) / a;
    if (xTop > -range && xTop < range) pts.push({ x: xTop, y: range });
  }

  // Deduplicate points
  const unique: { x: number; y: number }[] = [];
  for (const p of pts) {
    if (!unique.some((u) => Math.hypot(u.x - p.x, u.y - p.y) < 1e-5)) {
      unique.push(p);
    }
  }
  if (unique.length >= 2) return [unique[0], unique[1]];

  // Fallback if line is outside viewport: still compute extended endpoints so SVG clipPath clips it
  if (Math.abs(b) >= Math.abs(a)) {
    return [
      { x: -range, y: (c - a * -range) / b },
      { x: range, y: (c - a * range) / b }
    ];
  }
  return [
    { x: (c - b * -range) / a, y: -range },
    { x: (c - b * range) / a, y: range }
  ];
}

// ============================================================================
// CURRICULUM DATA: NCERT CLASS 10 CHAPTER 3 CONCEPTS, QUESTIONS & BADGES
// ============================================================================

interface ConceptLesson {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  summary: string;
  keyFormula: string;
  ncertExplanation: string[];
  realWorldContext: string;
  exampleProblem: {
    question: string;
    system: LinearSystem;
    steps: { title: string; math: string; reason: string }[];
    conclusion: string;
  };
  misconception: {
    myth: string;
    reality: string;
  };
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const CONCEPT_LESSONS: ConceptLesson[] = [
  {
    id: 'c1-linear-two-vars',
    number: '3.1',
    title: 'Linear Equations in Two Variables',
    subtitle: 'Foundations & Standard Form ax + by + c = 0',
    summary:
      'An equation that can be put in the form ax + by + c = 0 (or ax + by = c), where a, b, and c are real numbers and a, b are not both zero.',
    keyFormula: 'a x + b y + c = 0   (where a² + b² ≠ 0)',
    ncertExplanation: [
      'A linear equation in two variables (usually x and y) relates two unknown quantities whose highest power (degree) is strictly 1.',
      'The condition "a and b are not both zero" is algebraically written as a² + b² ≠ 0. If both a = 0 and b = 0, the variables vanish completely.',
      'Unlike a linear equation in one variable (like 2x + 5 = 11) which has a single number as its solution, a linear equation in two variables has an ordered pair (x, y) as a solution and possesses infinitely many such solutions.'
    ],
    realWorldContext:
      'Suppose the coach of a cricket team buys 3 bats and 6 balls for ₹3,900. Let the cost of 1 bat be ₹x and 1 ball be ₹y. Then 3x + 6y = 3900 models the relationship between the two unknown prices.',
    exampleProblem: {
      question: 'Check whether (x = 2, y = 3) and (x = 5, y = 1) are solutions of the linear equation 2x + 3y = 13.',
      system: { a1: 2, b1: 3, c1: 13, a2: 1, b2: 1, c2: 5 },
      steps: [
        {
          title: 'Substitute (x = 2, y = 3) into LHS of 2x + 3y = 13',
          math: 'LHS = 2(2) + 3(3) = 4 + 9 = 13 = RHS',
          reason: 'Since LHS equals RHS (13 = 13), the ordered pair (2, 3) lies on the line and IS a valid solution.'
        },
        {
          title: 'Substitute (x = 5, y = 1) into LHS of 2x + 3y = 13',
          math: 'LHS = 2(5) + 3(1) = 10 + 3 = 13 = RHS',
          reason: 'Again LHS = RHS! Both (2, 3) and (5, 1) are solutions to the same single equation.'
        }
      ],
      conclusion: 'A single linear equation in two variables has infinitely many ordered-pair solutions (x, y).'
    },
    misconception: {
      myth: '"The equation x = 4 has only one variable, so it cannot be written as a linear equation in two variables."',
      reality:
        'In a 2D coordinate plane, x = 4 is a linear equation in two variables written as 1·x + 0·y = 4, where a = 1, b = 0, c = 4. Here y can take any real value while x remains 4!'
    },
    quickCheck: {
      question: 'Which of the following is a valid linear equation in two variables in standard form?',
      options: [
        '2x² + 3y = 7',
        '0x + 0y = 5',
        '3x - 4y + 12 = 0',
        'xy + 2x = 8'
      ],
      correctIndex: 2,
      explanation: '3x - 4y + 12 = 0 has degree 1 in both variables and a = 3, b = -4 (not both zero). Note that xy has degree 2 (product of two variables).'
    }
  },
  {
    id: 'c2-graphical-rep',
    number: '3.2',
    title: 'Graphical Representation of a Linear Equation',
    subtitle: 'Connecting Algebra to Geometry on the Cartesian Plane',
    summary:
      'Geometrically, every linear equation ax + by = c represents a straight line on the Cartesian coordinate plane.',
    keyFormula: 'Every solution (x, y) ⟺ A point on the line ax + by = c',
    ncertExplanation: [
      'Every ordered pair (x, y) that satisfies ax + by = c corresponds to a unique point lying on the straight line representing that equation.',
      'Conversely, the coordinates of every point lying on that straight line satisfy the equation ax + by = c.',
      'To plot a straight line accurately, we only need two distinct points—most conveniently the Y-intercept (set x = 0, so y = c/b) and the X-intercept (set y = 0, so x = c/a), plus a third point as a check.'
    ],
    realWorldContext:
      'When Akhila goes to a village fair with ₹20, where Giant Wheel rides cost ₹3 each (x) and Hoopla games cost ₹4 each (y), plotting 3x + 4y = 20 shows every possible budget combination on a single straight line.',
    exampleProblem: {
      question: 'Find the X-intercept and Y-intercept of the line 2x + 4y = 8 to plot its graph.',
      system: { a1: 2, b1: 4, c1: 8, a2: 1, b2: -1, c2: 1 },
      steps: [
        {
          title: 'Find Y-intercept (where the line crosses the Y-axis)',
          math: 'Put x = 0  ⇒  2(0) + 4y = 8  ⇒  4y = 8  ⇒  y = 2. Point: (0, 2)',
          reason: 'Every point on the Y-axis has x-coordinate equal to 0.'
        },
        {
          title: 'Find X-intercept (where the line crosses the X-axis)',
          math: 'Put y = 0  ⇒  2x + 4(0) = 8  ⇒  2x = 8  ⇒  x = 4. Point: (4, 0)',
          reason: 'Every point on the X-axis has y-coordinate equal to 0.'
        }
      ],
      conclusion: 'Joining (0, 2) and (4, 0) with a straight ruler gives the complete graph of 2x + 4y = 8.'
    },
    misconception: {
      myth: '"Only integer coordinates like (0, 2) and (4, 0) are solutions of 2x + 4y = 8."',
      reality:
        'The line is continuous! Every fractional or irrational point on the line—such as (1, 1.5) or (√2, 2 - √2/2)—is also a valid solution.'
    },
    quickCheck: {
      question: 'At what point does the graph of the linear equation 3x + 2y = 12 intersect the Y-axis?',
      options: ['(4, 0)', '(0, 6)', '(6, 0)', '(0, 4)'],
      correctIndex: 1,
      explanation: 'On the Y-axis, x = 0. Substituting x = 0 into 3(0) + 2y = 12 gives 2y = 12, so y = 6. Thus the point is (0, 6).'
    }
  },
  {
    id: 'c3-pair-of-equations',
    number: '3.3',
    title: 'Pair of Linear Equations in Two Variables',
    subtitle: 'Simultaneous Linear Systems & Geometric Possibilities',
    summary:
      'Two linear equations in the same two variables x and y considered together form a pair (or system) of simultaneous linear equations.',
    keyFormula: 'a₁x + b₁y = c₁   and   a₂x + b₂y = c₂',
    ncertExplanation: [
      'A pair of linear equations in two variables x and y is written as a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0 (or with constants on the RHS).',
      'A solution to the pair is an ordered pair (x, y) that satisfies BOTH equations simultaneously.',
      'Since each equation represents a straight line in a plane, drawing two lines on the same Cartesian plane creates exactly THREE geometric possibilities: (1) They intersect at one point, (2) They are parallel and never meet, or (3) They overlap completely (coincident).'
    ],
    realWorldContext:
      'Comparing two mobile data plans or two taxi services (e.g., Cab A has ₹50 base fare + ₹12/km; Cab B has ₹80 base fare + ₹9/km) requires two equations in Distance (x) and Total Cost (y) simultaneously.',
    exampleProblem: {
      question: 'Formulate a pair of linear equations: The sum of two numbers is 10 and their difference is 4.',
      system: { a1: 1, b1: 1, c1: 10, a2: 1, b2: -1, c2: 4 },
      steps: [
        {
          title: 'Define the two variables clearly',
          math: 'Let the larger number be x and the smaller number be y.',
          reason: 'Assigning distinct variables to the two unknowns allows us to translate each condition into an equation.'
        },
        {
          title: 'Translate Condition 1 (Sum is 10) and Condition 2 (Difference is 4)',
          math: 'Equation (1): x + y = 10   |   Equation (2): x - y = 4',
          reason: 'Both conditions must hold true for the same pair (x, y), which here is (7, 3).'
        }
      ],
      conclusion: 'The common solution (7, 3) satisfies both 7 + 3 = 10 and 7 - 3 = 4.'
    },
    misconception: {
      myth: '"Two straight lines in a 2D plane can intersect at two different points if they are steep enough."',
      reality:
        'By Euclidean geometry, two distinct straight lines in a plane can share at most ONE common point. If they share two distinct points, they must be the exact same (coincident) line!'
    },
    quickCheck: {
      question: 'If two straight lines are drawn in the same plane, which of the following is NOT geometrically possible?',
      options: [
        'They intersect at exactly one point',
        'They are parallel and never intersect',
        'They intersect at exactly two distinct points',
        'They are coincident (overlap everywhere)'
      ],
      correctIndex: 2,
      explanation: 'Straight lines have constant slope and never curve back, so they cannot cross each other twice without being the exact same line.'
    }
  },
  {
    id: 'c4-unique-solution',
    number: '3.4',
    title: 'Case 1: Unique Solution (Intersecting Lines)',
    subtitle: 'When Slopes Differ: a₁/a₂ ≠ b₁/b₂',
    summary:
      'When the ratio of x-coefficients is not equal to the ratio of y-coefficients, the two lines have different slopes and intersect at a single unique point.',
    keyFormula: 'a₁ / a₂ ≠ b₁ / b₂   ⟺   Unique Solution (Intersecting Lines)',
    ncertExplanation: [
      'In slope-intercept form y = (-a/b)x + (c/b), the slope of a line is m = -a/b.',
      'For two lines to intersect at a single point, their slopes must be different: -a₁/b₁ ≠ -a₂/b₂, which rearranges directly to the NCERT ratio test: a₁/a₂ ≠ b₁/b₂.',
      'Equivalently, the determinant a₁b₂ - a₂b₁ ≠ 0. Notice that the constant terms c₁ and c₂ do not even need to be checked once a₁/a₂ ≠ b₁/b₂ holds!'
    ],
    realWorldContext:
      'Champa bought skirts and pants where the number of skirts (y) is 2 less than twice the pants (x): 2x - y = 2, and also 4 less than four times the pants: 4x - y = 4. Since 2/4 ≠ (-1)/(-1), there is a unique answer (x = 1, y = 0).',
    exampleProblem: {
      question: 'Test whether 2x + y = 7 and x - y = 2 have a unique solution, and find the point of intersection.',
      system: { a1: 2, b1: 1, c1: 7, a2: 1, b2: -1, c2: 2 },
      steps: [
        {
          title: 'Compare the coefficient ratios a₁/a₂ and b₁/b₂',
          math: 'a₁/a₂ = 2/1 = 2   and   b₁/b₂ = 1/(-1) = -1',
          reason: 'Since 2 ≠ -1, we immediately have a₁/a₂ ≠ b₁/b₂.'
        },
        {
          title: 'Find the unique intersection coordinates',
          math: 'Adding (2x + y) + (x - y) = 7 + 2  ⇒  3x = 9  ⇒  x = 3, y = 1',
          reason: 'The two lines cross at the single point (3, 1).'
        }
      ],
      conclusion: 'Because a₁/a₂ ≠ b₁/b₂, the lines intersect at (3, 1) and the system has a unique solution.'
    },
    misconception: {
      myth: '"If c₁ = 0 and c₂ = 0, the lines cannot have a unique solution."',
      reality:
        'When c₁ = 0 and c₂ = 0 (homogeneous equations like 2x + 3y = 0 and x - y = 0) with a₁/a₂ ≠ b₁/b₂, they DO have a unique solution—they intersect right at the origin (0, 0)!'
    },
    quickCheck: {
      question: 'For the pair 5x - 4y + 8 = 0 and 7x + 6y - 9 = 0, what is the nature of the lines?',
      options: [
        'Parallel lines (No solution)',
        'Intersecting lines (Unique solution)',
        'Coincident lines (Infinitely many solutions)',
        'Cannot be determined without plotting'
      ],
      correctIndex: 1,
      explanation: 'Here a₁/a₂ = 5/7 and b₁/b₂ = -4/6 = -2/3. Since 5/7 ≠ -2/3 (a₁/a₂ ≠ b₁/b₂), the lines intersect at a unique point.'
    }
  },
  {
    id: 'c5-no-solution',
    number: '3.5',
    title: 'Case 2: No Solution (Parallel Lines)',
    subtitle: 'Equal Slopes, Different Intercepts: a₁/a₂ = b₁/b₂ ≠ c₁/c₂',
    summary:
      'When the x and y coefficients are in the same ratio but the constants are not, the lines are parallel and never intersect.',
    keyFormula: 'a₁ / a₂ = b₁ / b₂ ≠ c₁ / c₂   ⟺   No Solution (Parallel Lines)',
    ncertExplanation: [
      'When a₁/a₂ = b₁/b₂, both lines have the exact same slope (steepness and direction).',
      'Because the ratio of constants c₁/c₂ is different, the two lines cross the axes at different points—just like the two steel rails of a straight railway track.',
      'Since parallel lines maintain a constant non-zero distance between them and never meet, there is NO ordered pair (x, y) that lies on both lines.'
    ],
    realWorldContext:
      'Two train tracks follow paths x + 2y - 4 = 0 and 2x + 4y - 12 = 0. Will the trains ever cross paths? Since 1/2 = 2/4 ≠ (-4)/(-12), the tracks are parallel and never cross.',
    exampleProblem: {
      question: 'Verify algebraically and geometrically why x + 2y = 4 and 2x + 4y = 12 have no solution.',
      system: { a1: 1, b1: 2, c1: 4, a2: 2, b2: 4, c2: 12 },
      steps: [
        {
          title: 'Compute all three ratios a₁/a₂, b₁/b₂, and c₁/c₂',
          math: 'a₁/a₂ = 1/2,   b₁/b₂ = 2/4 = 1/2,   c₁/c₂ = 4/12 = 1/3',
          reason: 'Notice that a₁/a₂ = b₁/b₂ = 1/2, which does NOT equal c₁/c₂ = 1/3.'
        },
        {
          title: 'Observe the algebraic contradiction',
          math: 'Multiply Eq(1) by 2: 2x + 4y = 8. Compare with Eq(2): 2x + 4y = 12  ⇒  8 = 12 (False!)',
          reason: 'The same expression 2x + 4y cannot simultaneously equal 8 and 12.'
        }
      ],
      conclusion: 'The lines are parallel with slope -1/2 and y-intercepts (0, 2) and (0, 3); hence no solution exists.'
    },
    misconception: {
      myth: '"You can compare c₁/c₂ even when c₁ is on the LHS in Equation 1 and c₂ is on the RHS in Equation 2."',
      reality:
        'CRITICAL TRAP! Both equations MUST be written in the same form—either both ax + by = c OR both ax + by + c = 0—before you compute c₁/c₂, otherwise a sign error will flip your conclusion!'
    },
    quickCheck: {
      question: 'Find the value of k for which the pair 3x + y = 1 and 6x + ky = 5 has NO solution.',
      options: ['k = 2', 'k = 3', 'k = -2', 'k = 15'],
      correctIndex: 0,
      explanation: 'For no solution, a₁/a₂ = b₁/b₂ ≠ c₁/c₂. Thus 3/6 = 1/k ≠ 1/5, which gives 1/2 = 1/k ⇒ k = 2 (and clearly 1/2 ≠ 1/5).'
    }
  },
  {
    id: 'c6-infinite-solutions',
    number: '3.6',
    title: 'Case 3: Infinitely Many Solutions (Coincident Lines)',
    subtitle: 'Identical Lines in Disguise: a₁/a₂ = b₁/b₂ = c₁/c₂',
    summary:
      'When all three ratios are equal, one equation is simply a non-zero multiple of the other, so both equations represent the exact same line.',
    keyFormula: 'a₁ / a₂ = b₁ / b₂ = c₁ / c₂   ⟺   Infinitely Many Solutions (Coincident)',
    ncertExplanation: [
      'If a₁/a₂ = b₁/b₂ = c₁/c₂ = k, then the first equation is just k times the second equation.',
      'Geometrically, when you plot both lines, the second line lies directly on top of the first line (coincident lines).',
      'Every single point (x, y) on that line is a common point of both equations, meaning there are infinitely many solutions.'
    ],
    realWorldContext:
      'Romila bought 2 pencils and 3 erasers for ₹9 (2x + 3y = 9). Her friend Sonali bought 4 pencils and 6 erasers of the same kind for ₹18 (4x + 6y = 18). Sonali’s purchase gives no new independent price information because she simply bought double of everything!',
    exampleProblem: {
      question: 'Analyze the system 2x + 3y = 9 and 4x + 6y = 18.',
      system: { a1: 2, b1: 3, c1: 9, a2: 4, b2: 6, c2: 18 },
      steps: [
        {
          title: 'Compute the three coefficient ratios',
          math: 'a₁/a₂ = 2/4 = 1/2,   b₁/b₂ = 3/6 = 1/2,   c₁/c₂ = 9/18 = 1/2',
          reason: 'All three ratios equal 1/2: a₁/a₂ = b₁/b₂ = c₁/c₂.'
        },
        {
          title: 'Find sample solutions along the coincident line',
          math: 'When x = 0, y = 3 → (0, 3). When y = 0, x = 4.5 → (4.5, 0). When x = 3, y = 1 → (3, 1).',
          reason: 'All of these infinitely many points on y = (9 - 2x)/3 satisfy both equations.'
        }
      ],
      conclusion: 'The equations are dependent and coincident, yielding infinitely many solutions.'
    },
    misconception: {
      myth: '"Infinitely many solutions means ANY random pair of numbers (x, y) in the plane is a solution."',
      reality:
        'False! Only the infinitely many points that actually lie ON the line (such as (0, 3) or (3, 1)) are solutions. A point off the line like (1, 1) is NOT a solution!'
    },
    quickCheck: {
      question: 'If the lines 2x + 3y = 7 and (a)x + (b)y = 14 are coincident, what are the values of a and b?',
      options: [
        'a = 2, b = 3',
        'a = 4, b = 6',
        'a = 4, b = 3',
        'a = 6, b = 4'
      ],
      correctIndex: 1,
      explanation: 'Since c₁/c₂ = 7/14 = 1/2, for coincident lines we need 2/a = 1/2 ⇒ a = 4 and 3/b = 1/2 ⇒ b = 6.'
    }
  },
  {
    id: 'c7-consistency',
    number: '3.7',
    title: 'Consistency and Inconsistency of Linear Systems',
    subtitle: 'Classifying Consistent (Independent vs Dependent) & Inconsistent Pairs',
    summary:
      'A pair of linear equations is called CONSISTENT if it has at least one solution, and INCONSISTENT if it has no solution at all.',
    keyFormula: 'Consistent = { Unique Solution OR Infinitely Many Solutions }   |   Inconsistent = { No Solution }',
    ncertExplanation: [
      'A system is CONSISTENT if a solution exists (at least one ordered pair satisfies both equations). This includes BOTH intersecting lines (1 solution, called Consistent & Independent) AND coincident lines (∞ solutions, called Consistent & Dependent).',
      'A system is INCONSISTENT if no solution exists anywhere in the plane—which happens exclusively when the lines are parallel (a₁/a₂ = b₁/b₂ ≠ c₁/c₂).',
      'In CBSE board exams, questions frequently ask "Check whether the pair of equations is consistent or inconsistent." Always test both Unique and Infinite cases as Consistent!'
    ],
    realWorldContext:
      'In engineering or timetable scheduling, an "inconsistent" system means your constraints contradict each other and cannot be satisfied simultaneously.',
    exampleProblem: {
      question: 'Classify the system 3x + 2y = 5 and 2x - 3y = 7 as Consistent or Inconsistent.',
      system: { a1: 3, b1: 2, c1: 5, a2: 2, b2: -3, c2: 7 },
      steps: [
        {
          title: 'Calculate a₁/a₂ and b₁/b₂',
          math: 'a₁/a₂ = 3/2   and   b₁/b₂ = 2/(-3) = -2/3',
          reason: 'Compare the two ratios first.'
        },
        {
          title: 'Apply the Consistency Criterion',
          math: '3/2 ≠ -2/3  ⇒  a₁/a₂ ≠ b₁/b₂  ⇒  Unique Solution',
          reason: 'Since the pair has a unique solution (at least one solution exists), it is Consistent (Independent).'
        }
      ],
      conclusion: 'The given pair of linear equations is Consistent.'
    },
    misconception: {
      myth: '"Coincident lines are inconsistent because they don’t give a single unique answer."',
      reality:
        'According to NCERT Class 10 Mathematics, a dependent pair (coincident lines) has infinitely many solutions, and because solutions exist, a dependent pair is ALWAYS CONSISTENT!'
    },
    quickCheck: {
      question: 'A dependent pair of linear equations in two variables is always:',
      options: [
        'Inconsistent',
        'Consistent with a unique solution',
        'Consistent with infinitely many solutions',
        'Parallel on the graph'
      ],
      correctIndex: 2,
      explanation: 'A dependent pair represents coincident lines, which have infinitely many solutions and are therefore Consistent.'
    }
  },
  {
    id: 'c8-algebraic-methods',
    number: '3.8',
    title: 'Algebraic Methods of Solving Linear Equations',
    subtitle: 'Substitution, Elimination & Cross-Multiplication Methods',
    summary:
      'While graphs give visual intuition, reading coordinates like (19/29, 6/29) from a graph is imprecise. Algebraic methods yield exact solutions.',
    keyFormula: 'x = (c₁b₂ - c₂b₁)/(a₁b₂ - a₂b₁),   y = (a₁c₂ - a₂c₁)/(a₁b₂ - a₂b₁)',
    ncertExplanation: [
      '1. Substitution Method: Express one variable (say y) in terms of x from the simpler equation, and substitute that expression into the other equation to reduce it to a 1-variable equation.',
      '2. Elimination Method: Multiply one or both equations by suitable non-zero constants so the coefficients of one variable become numerically equal, then add or subtract the equations to eliminate that variable.',
      '3. Cross-Multiplication Method: Write the equations as a₁x + b₁y + c₁\' = 0 and a₂x + b₂y + c₂\' = 0 (where c\' = -c) and use the cross-determinant ratios x / (b₁c₂\' - b₂c₁\') = y / (c₁\'a₂ - c₂\'a₁) = 1 / (a₁b₂ - a₂b₁).'
    ],
    realWorldContext:
      'Computer algebra systems and scientific calculators use elimination and determinant formulas (Cramer’s rule / Cross-Multiplication) to solve systems with millisecond precision.',
    exampleProblem: {
      question: 'Solve x + y = 14 and x - y = 4 using both Substitution and Elimination.',
      system: { a1: 1, b1: 1, c1: 14, a2: 1, b2: -1, c2: 4 },
      steps: [
        {
          title: 'By Substitution: Express x from Equation (2)',
          math: 'From x - y = 4, we get x = y + 4. Substitute into Eq(1): (y + 4) + y = 14  ⇒  2y = 10  ⇒  y = 5',
          reason: 'Replacing x in terms of y leaves an equation with only y.'
        },
        {
          title: 'By Elimination: Add Equation (1) and Equation (2) directly',
          math: '(x + y) + (x - y) = 14 + 4  ⇒  2x = 18  ⇒  x = 9, and y = 14 - 9 = 5',
          reason: 'Because +y and -y are additive inverses, adding the equations eliminates y in one step!'
        }
      ],
      conclusion: 'All three algebraic methods always yield the exact same solution: x = 9, y = 5.'
    },
    misconception: {
      myth: '"When using Substitution, you can express x from Equation (1) and substitute it back into Equation (1) itself."',
      reality:
        'Substituting an expression from Equation (1) back into Equation (1) just simplifies to a trivial identity like 14 = 14! You MUST substitute it into the OTHER equation (Equation 2).'
    },
    quickCheck: {
      question: 'When solving 2x + 3y = 8 and 4x + 6y = 7 by Elimination (multiplying Eq 1 by 2 and subtracting), you obtain 0 = 9. What does this mean?',
      options: [
        'x = 0 and y = 9',
        'The equations have infinitely many solutions',
        'The equations are inconsistent and have no solution',
        'Elimination method does not work for these numbers'
      ],
      correctIndex: 2,
      explanation: 'A false numerical statement like 0 = 9 with all variables eliminated proves the system has no solution (parallel lines).'
    }
  }
];

// ============================================================================
// PRACTICE ZONE QUESTIONS (BEGINNER, INTERMEDIATE, ADVANCED)
// ============================================================================

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  // BEGINNER
  {
    id: 'pq-b1',
    difficulty: 'Beginner',
    type: 'MCQ',
    topic: 'Ratio Conditions & Consistency',
    prompt: 'Compare the ratios a₁/a₂, b₁/b₂, and c₁/c₂ to determine how the lines 2x - 3y = 8 and 4x - 6y = 9 behave graphically.',
    equationPair: { a1: 2, b1: -3, c1: 8, a2: 4, b2: -6, c2: 9 },
    options: [
      'Intersecting at a unique point',
      'Parallel lines (No solution)',
      'Coincident lines (Infinitely many solutions)',
      'Perpendicular lines passing through origin'
    ],
    correctAnswer: 'Parallel lines (No solution)',
    hint: 'Compute a₁/a₂ = 2/4 and b₁/b₂ = (-3)/(-6), then compare with c₁/c₂ = 8/9.',
    misconceptionDiagnosis: {
      'Intersecting at a unique point':
        'Check your signs in b₁/b₂! Both b₁ = -3 and b₂ = -6 are negative, so (-3)/(-6) simplifies to +1/2, which equals a₁/a₂ = 2/4 = 1/2.',
      'Coincident lines (Infinitely many solutions)':
        'While a₁/a₂ = b₁/b₂ = 1/2, check the constant ratio c₁/c₂ = 8/9. Since 1/2 ≠ 8/9, the lines are parallel, not coincident.'
    },
    defaultDiagnosis: 'Compare all three ratios carefully: a₁/a₂ = 2/4 = 1/2, b₁/b₂ = -3/-6 = 1/2, and c₁/c₂ = 8/9.',
    stepByStepSolution: [
      'Step 1: Identify coefficients: a₁ = 2, b₁ = -3, c₁ = 8 and a₂ = 4, b₂ = -6, c₂ = 9.',
      'Step 2: Compute ratios: a₁/a₂ = 2/4 = 1/2; b₁/b₂ = (-3)/(-6) = 1/2; c₁/c₂ = 8/9.',
      'Step 3: Since a₁/a₂ = b₁/b₂ ≠ c₁/c₂ (1/2 = 1/2 ≠ 8/9), the lines are parallel and have no solution.'
    ]
  },
  {
    id: 'pq-b2',
    difficulty: 'Beginner',
    type: 'Numerical',
    topic: 'Substitution & Elimination Methods',
    prompt: 'If x + y = 12 and x - y = 4, find the numerical value of x.',
    equationPair: { a1: 1, b1: 1, c1: 12, a2: 1, b2: -1, c2: 4 },
    correctAnswer: '8',
    numericTolerance: 0.01,
    hint: 'Add the two equations (x + y) + (x - y) = 12 + 4 so that +y and -y cancel out.',
    misconceptionDiagnosis: {
      '4': 'Wait—4 is the value of y (since 8 + 4 = 12 and 8 - 4 = 4)! The question asks for the value of x.',
      '16': 'You found 2x = 16! Don’t forget to divide both sides by 2 to get x.'
    },
    defaultDiagnosis: 'Try adding both equations directly: (x + y) + (x - y) = 12 + 4 gives 2x = 16. Now divide by 2.',
    stepByStepSolution: [
      'Step 1: Write the equations: (1) x + y = 12 and (2) x - y = 4.',
      'Step 2: Add Equation (1) and Equation (2): 2x = 16.',
      'Step 3: Divide by 2: x = 8 (and substituting back gives y = 4).'
    ]
  },
  {
    id: 'pq-b3',
    difficulty: 'Beginner',
    type: 'Graph',
    topic: 'Graphical Solutions & Geometry',
    prompt: 'Examine the interactive coordinate graph below for Line 1 (x + y = 6) and Line 2 (x - y = 2). What are the coordinates of their intersection point?',
    equationPair: { a1: 1, b1: 1, c1: 6, a2: 1, b2: -1, c2: 2 },
    options: ['(4, 2)', '(2, 4)', '(3, 3)', '(5, 1)'],
    correctAnswer: '(4, 2)',
    hint: 'Look at the green intersection marker on the graph: read the horizontal X-coordinate first, then the vertical Y-coordinate.',
    misconceptionDiagnosis: {
      '(2, 4)': 'Careful! You swapped the x and y coordinates. Always write an ordered pair as (x, y) where x is horizontal and y is vertical. At (2, 4), x - y = 2 - 4 = -2 ≠ 2.'
    },
    defaultDiagnosis: 'Check which ordered pair (x, y) satisfies both x + y = 6 and x - y = 2.',
    stepByStepSolution: [
      'Step 1: Locate the intersection point of Line 1 and Line 2 on the Cartesian plane.',
      'Step 2: Project down to the X-axis to read x = 4, and across to the Y-axis to read y = 2.',
      'Step 3: Verify: 4 + 2 = 6 and 4 - 2 = 2. Thus the solution is (4, 2).'
    ]
  },
  {
    id: 'pq-b4',
    difficulty: 'Beginner',
    type: 'Conceptual',
    topic: 'Ratio Conditions & Consistency',
    prompt: 'If a pair of linear equations is CONSISTENT, then the lines represented by them are:',
    options: [
      'Always intersecting only',
      'Parallel lines',
      'Intersecting or Coincident',
      'Always coincident only'
    ],
    correctAnswer: 'Intersecting or Coincident',
    hint: 'Remember the definition of Consistent: the system has AT LEAST one solution.',
    misconceptionDiagnosis: {
      'Always intersecting only':
        'Common CBSE trap! Intersecting lines have 1 solution, which is consistent—but Coincident lines have infinitely many solutions, so they are ALSO consistent (dependent)!'
    },
    defaultDiagnosis: 'A consistent system means at least one solution exists. Which two geometric cases have solutions?',
    stepByStepSolution: [
      'Step 1: Recall that a system is Consistent if it has at least one solution.',
      'Step 2: Intersecting lines have 1 unique solution (Consistent & Independent).',
      'Step 3: Coincident lines have infinitely many solutions (Consistent & Dependent). Hence, either Intersecting or Coincident.'
    ]
  },

  // INTERMEDIATE
  {
    id: 'pq-i1',
    difficulty: 'Intermediate',
    type: 'Numerical',
    topic: 'Substitution & Elimination Methods',
    prompt: 'Solve the system 3x + 4y = 10 and 2x - 2y = 2. Enter the value of x + y.',
    equationPair: { a1: 3, b1: 4, c1: 10, a2: 2, b2: -2, c2: 2 },
    correctAnswer: '3',
    numericTolerance: 0.01,
    hint: 'Multiply the second equation (2x - 2y = 2) by 2 to get 4x - 4y = 4, then add it to 3x + 4y = 10 to find x and y.',
    misconceptionDiagnosis: {
      '2': 'You found x = 2! Now find y by substituting x = 2 into 2x - 2y = 2, and then add x + y.',
      '1': 'You found y = 1! The question asks for the sum x + y.'
    },
    defaultDiagnosis: 'First solve for x and y using Elimination, then compute their sum x + y.',
    stepByStepSolution: [
      'Step 1: Multiply Eq(2) 2x - 2y = 2 by 2 to match the y-coefficient magnitude: 4x - 4y = 4.',
      'Step 2: Add to Eq(1) (3x + 4y = 10): 7x = 14 ⇒ x = 2.',
      'Step 3: Substitute x = 2 into 3(2) + 4y = 10 ⇒ 4y = 4 ⇒ y = 1.',
      'Step 4: Therefore, x + y = 2 + 1 = 3.'
    ]
  },
  {
    id: 'pq-i2',
    difficulty: 'Intermediate',
    type: 'MCQ',
    topic: 'Cross-Multiplication & Parameter k Problems',
    prompt: 'For what value of p does the pair of equations 4x + py + 8 = 0 and 2x + 2y + 2 = 0 have a UNIQUE solution?',
    options: [
      'p = 4 only',
      'All real values of p except p = 4',
      'All real values of p except p = 2',
      'p = 2 only'
    ],
    correctAnswer: 'All real values of p except p = 4',
    hint: 'For a unique solution, use the inequality condition a₁/a₂ ≠ b₁/b₂.',
    misconceptionDiagnosis: {
      'p = 4 only':
        'Watch out! For p = 4, we get 4/2 = 4/2 ≠ 8/2, which makes the lines PARALLEL (no solution). A unique solution requires an INEQUALITY (p ≠ 4)!'
    },
    defaultDiagnosis: 'Set up the unique solution condition: a₁/a₂ ≠ b₁/b₂ ⇒ 4/2 ≠ p/2.',
    stepByStepSolution: [
      'Step 1: Condition for unique solution is a₁/a₂ ≠ b₁/b₂.',
      'Step 2: Substitute a₁ = 4, a₂ = 2, b₁ = p, b₂ = 2: 4/2 ≠ p/2.',
      'Step 3: Multiply both sides by 2: p ≠ 4. Thus, the system has a unique solution for all real values of p except 4.'
    ]
  },
  {
    id: 'pq-i3',
    difficulty: 'Intermediate',
    type: 'Graph',
    topic: 'Graphical Solutions & Geometry',
    prompt: 'Look at the graph of the lines 2x + y = 6 and 2x - y + 2 = 0 (i.e. 2x - y = -2) below. What is the area (in sq. units) of the triangle formed by these two lines and the X-axis?',
    equationPair: { a1: 2, b1: 1, c1: 6, a2: 2, b2: -1, c2: -2 },
    options: ['8 sq. units', '16 sq. units', '6 sq. units', '4 sq. units'],
    correctAnswer: '8 sq. units',
    hint: 'Find the base along the X-axis between the two X-intercepts (-1, 0) and (3, 0), and use the y-coordinate of the intersection point (1, 4) as the height!',
    misconceptionDiagnosis: {
      '16 sq. units':
        'You multiplied Base × Height (4 × 4 = 16), forgetting the factor of 1/2 in the area of a triangle formula: Area = ½ × Base × Height!'
    },
    defaultDiagnosis: 'Area of triangle = ½ × Base × Height. Find the X-intercepts of both lines for the base, and the y-coordinate of their intersection for the height.',
    stepByStepSolution: [
      'Step 1: The two lines intersect at (1, 4), so the vertical height of the triangle above the X-axis is h = 4 units.',
      'Step 2: Line 1 (2x + y = 6) meets the X-axis at (3, 0). Line 2 (2x - y = -2) meets the X-axis at (-1, 0).',
      'Step 3: Base length along X-axis = 3 - (-1) = 4 units.',
      'Step 4: Area = ½ × Base × Height = ½ × 4 × 4 = 8 sq. units.'
    ]
  },
  {
    id: 'pq-i4',
    difficulty: 'Intermediate',
    type: 'Conceptual',
    topic: 'Real-World Word Problems',
    prompt: 'Five years ago, Nuri was thrice as old as Sonu. Ten years later, Nuri will be twice as old as Sonu. If Nuri’s present age is x and Sonu’s present age is y, which pair of linear equations correctly models this problem?',
    options: [
      'x - 3y = -10 and x - 2y = 10',
      'x - 3y = 10 and x - 2y = -10',
      'x + 3y = -10 and x + 2y = 10',
      '3x - y = 5 and 2x - y = 10'
    ],
    correctAnswer: 'x - 3y = -10 and x - 2y = 10',
    hint: 'Five years ago their ages were (x - 5) and (y - 5). Set (x - 5) = 3(y - 5) and simplify!',
    misconceptionDiagnosis: {
      'x - 3y = 10 and x - 2y = -10':
        'Check the sign when simplifying (x - 5) = 3(y - 5): x - 5 = 3y - 15 ⇒ x - 3y = -15 + 5 = -10 (not +10).'
    },
    defaultDiagnosis: 'Write both ages 5 years ago as (x - 5) and (y - 5), and 10 years later as (x + 10) and (y + 10).',
    stepByStepSolution: [
      'Step 1: 5 years ago: (x - 5) = 3(y - 5) ⇒ x - 5 = 3y - 15 ⇒ x - 3y = -10.',
      'Step 2: 10 years later: (x + 10) = 2(y + 10) ⇒ x + 10 = 2y + 20 ⇒ x - 2y = 10.',
      'Step 3: Solving gives y = 20 (Sonu) and x = 50 (Nuri).'
    ]
  },

  // ADVANCED
  {
    id: 'pq-a1',
    difficulty: 'Advanced',
    type: 'Numerical',
    topic: 'Cross-Multiplication & Parameter k Problems',
    prompt: 'For what positive value of k will the pair of equations kx + 3y = k - 3 and 12x + ky = k have INFINITELY MANY solutions?',
    correctAnswer: '6',
    numericTolerance: 0.01,
    hint: 'Set a₁/a₂ = b₁/b₂ = c₁/c₂ ⇒ k/12 = 3/k = (k - 3)/k. Check which value of k satisfies BOTH equalities!',
    misconceptionDiagnosis: {
      '-6': 'While k² = 36 gives k = ±6 from the first two ratios, check the third ratio for k = -6: (k - 3)/k = (-9)/(-6) = 3/2, whereas 3/(-6) = -1/2! Also the prompt asks for the positive value.',
      '36': 'You found k² = 36! Take the square root and verify with the third ratio.'
    },
    defaultDiagnosis: 'Use k/12 = 3/k to get k² = 36, and verify with 3/k = (k - 3)/k.',
    stepByStepSolution: [
      'Step 1: For infinitely many solutions, a₁/a₂ = b₁/b₂ = c₁/c₂ ⇒ k/12 = 3/k = (k - 3)/k.',
      'Step 2: From k/12 = 3/k, we get k² = 36 ⇒ k = 6 or k = -6.',
      'Step 3: From 3/k = (k - 3)/k (with k ≠ 0), numerators must match: 3 = k - 3 ⇒ k = 6.',
      'Step 4: Only k = 6 satisfies both conditions simultaneously.'
    ]
  },
  {
    id: 'pq-a2',
    difficulty: 'Advanced',
    type: 'Numerical',
    topic: 'Substitution & Elimination Methods',
    prompt: 'Solve the symmetric system: 47x + 31y = 63 and 31x + 47y = 15. Find the value of x.',
    equationPair: { a1: 47, b1: 31, c1: 63, a2: 31, b2: 47, c2: 15 },
    correctAnswer: '2',
    numericTolerance: 0.01,
    hint: 'Notice how 47 and 31 swap places! Instead of multiplying by huge numbers, first ADD the two equations to find (x + y), and then SUBTRACT them to find (x - y).',
    misconceptionDiagnosis: {
      '-1': 'Wait: -1 is the value of y! Since x + y = 1 and x - y = 3, adding them gives 2x = 4 ⇒ x = 2.',
      '1': '1 is the value of (x + y) after dividing 78x + 78y = 78 by 78. Now subtract the two original equations to get (x - y) = 3!'
    },
    defaultDiagnosis: 'For interchanged-coefficient equations (ax + by = c₁, bx + ay = c₂), add them to get x + y and subtract them to get x - y.',
    stepByStepSolution: [
      'Step 1: Add both equations: (47 + 31)x + (31 + 47)y = 63 + 15 ⇒ 78x + 78y = 78 ⇒ x + y = 1 ... (Eq A).',
      'Step 2: Subtract Eq(2) from Eq(1): (47 - 31)x + (31 - 47)y = 63 - 15 ⇒ 16x - 16y = 48 ⇒ x - y = 3 ... (Eq B).',
      'Step 3: Add (Eq A) and (Eq B): 2x = 4 ⇒ x = 2 (and y = -1).'
    ]
  },
  {
    id: 'pq-a3',
    difficulty: 'Advanced',
    type: 'MCQ',
    topic: 'Real-World Word Problems',
    prompt: 'A boat goes 30 km upstream and 44 km downstream in 10 hours. If the speed of the boat in still water is x km/h and the speed of the stream is y km/h (with x > y), what is the boat’s effective speed upstream?',
    options: [
      '(x + y) km/h',
      '(x - y) km/h',
      '(y - x) km/h',
      '(x · y) km/h'
    ],
    correctAnswer: '(x - y) km/h',
    hint: 'Moving upstream means rowing AGAINST the river current, which slows the boat down.',
    misconceptionDiagnosis: {
      '(x + y) km/h':
        '(x + y) km/h is the DOWNSTREAM speed (when the stream pushes the boat forward). Upstream opposes the stream, so subtract y from x.',
      '(y - x) km/h':
        'If the stream speed y were greater than the boat speed x, the boat would be washed backward! For the boat to move upstream, x > y, so upstream speed is (x - y) km/h.'
    },
    defaultDiagnosis: 'Upstream opposes the current; downstream moves with the current.',
    stepByStepSolution: [
      'Step 1: Boat speed in still water = x km/h; Stream current speed = y km/h.',
      'Step 2: Moving upstream opposes the water flow, reducing effective ground speed to (x - y) km/h.',
      'Step 3: Time taken = Distance / Speed = 30/(x - y) + 44/(x + y) = 10 (reducible to linear equations by putting u = 1/(x - y) and v = 1/(x + y)).'
    ]
  }
];

// ============================================================================
// ASSESSMENT 10 QUESTIONS (COMPREHENSIVE NCERT EVALUATION)
// ============================================================================

interface AssessmentQuestion {
  id: string;
  number: number;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'aq-1',
    number: 1,
    topic: 'Graphical Solutions & Geometry',
    question: 'Graphically, the pair of equations 6x - 3y + 10 = 0 and 2x - y + 9 = 0 represents two lines which are:',
    options: [
      'Intersecting at exactly one point',
      'Parallel to each other',
      'Coincident lines',
      'Intersecting at exactly two points'
    ],
    correctIndex: 1,
    explanation: 'Here a₁/a₂ = 6/2 = 3, b₁/b₂ = (-3)/(-1) = 3, and c₁/c₂ = 10/9. Since a₁/a₂ = b₁/b₂ ≠ c₁/c₂, the lines are parallel.'
  },
  {
    id: 'aq-2',
    number: 2,
    topic: 'Ratio Conditions & Consistency',
    question: 'The pair of equations x + 2y + 5 = 0 and -3x - 6y + 1 = 0 has:',
    options: [
      'A unique solution',
      'Exactly two solutions',
      'Infinitely many solutions',
      'No solution (Inconsistent)'
    ],
    correctIndex: 3,
    explanation: 'a₁/a₂ = 1/(-3) = -1/3, b₁/b₂ = 2/(-6) = -1/3, while c₁/c₂ = 5/1. Since -1/3 = -1/3 ≠ 5/1, the system is inconsistent and has no solution.'
  },
  {
    id: 'aq-3',
    number: 3,
    topic: 'Graphical Solutions & Geometry',
    question: 'What is the geometric relationship between the lines x = -4 and y = 5 on the Cartesian coordinate plane?',
    options: [
      'Parallel lines',
      'Coincident lines',
      'Perpendicular lines intersecting at (-4, 5)',
      'Intersecting lines meeting at (5, -4)'
    ],
    correctIndex: 2,
    explanation: 'x = -4 is a vertical line parallel to the Y-axis and y = 5 is a horizontal line parallel to the X-axis. They are perpendicular and intersect at (-4, 5).'
  },
  {
    id: 'aq-4',
    number: 4,
    topic: 'Substitution & Elimination Methods',
    question: 'If (x, y) is the solution of the pair 2x + 3y = 11 and 2x - 4y = -24, and y = mx + 3, what is the value of m?',
    options: ['m = -1', 'm = 1', 'm = 2', 'm = -2'],
    correctIndex: 0,
    explanation: 'Subtracting the two equations gives 7y = 35 ⇒ y = 5. Then 2x + 15 = 11 ⇒ 2x = -4 ⇒ x = -2. Substituting (-2, 5) into 5 = m(-2) + 3 gives 2 = -2m ⇒ m = -1.'
  },
  {
    id: 'aq-5',
    number: 5,
    topic: 'Cross-Multiplication & Parameter k Problems',
    question: 'For what value of k do the equations 3x - y + 8 = 0 and 6x - ky = -16 represent coincident lines?',
    options: ['k = 1/2', 'k = -1/2', 'k = 2', 'k = -2'],
    correctIndex: 2,
    explanation: 'Rewrite the second equation in the same form: 6x - ky + 16 = 0. Then a₁/a₂ = 3/6 = 1/2 and c₁/c₂ = 8/16 = 1/2. Setting b₁/b₂ = (-1)/(-k) = 1/2 gives k = 2.'
  },
  {
    id: 'aq-6',
    number: 6,
    topic: 'Real-World Word Problems',
    question: 'The difference between two numbers is 26 and one number is three times the other. What are the two numbers?',
    options: ['39 and 13', '36 and 10', '42 and 16', '30 and 4'],
    correctIndex: 0,
    explanation: 'Let the numbers be x and y (x > y). Then x - y = 26 and x = 3y. Substituting gives 3y - y = 26 ⇒ 2y = 26 ⇒ y = 13 and x = 39.'
  },
  {
    id: 'aq-7',
    number: 7,
    topic: 'Substitution & Elimination Methods',
    question: 'Solve for x and y: 0.2x + 0.3y = 1.3 and 0.4x + 0.5y = 2.3.',
    options: [
      'x = 2, y = 3',
      'x = 3, y = 2',
      'x = 0.2, y = 0.3',
      'x = 4, y = 1'
    ],
    correctIndex: 0,
    explanation: 'Multiply both equations by 10 to clear decimals: 2x + 3y = 13 and 4x + 5y = 23. Multiply the first by 2 (4x + 6y = 26) and subtract: y = 3, which gives 2x + 9 = 13 ⇒ x = 2.'
  },
  {
    id: 'aq-8',
    number: 8,
    topic: 'Ratio Conditions & Consistency',
    question: 'One equation of a pair of dependent linear equations is -5x + 7y = 2. The second equation can be:',
    options: [
      '10x + 14y + 4 = 0',
      '-10x - 14y + 4 = 0',
      '-10x + 14y + 4 = 0',
      '10x - 14y = -4'
    ],
    correctIndex: 3,
    explanation: 'Multiplying -5x + 7y = 2 by -2 on both sides gives 10x - 14y = -4, so all three coefficient ratios equal -1/2.'
  },
  {
    id: 'aq-9',
    number: 9,
    topic: 'Real-World Word Problems',
    question: 'The larger of two supplementary angles exceeds the smaller by 18°. What are the measures of the two angles?',
    options: [
      '99° and 81°',
      '100° and 80°',
      '54° and 36°',
      '108° and 72°'
    ],
    correctIndex: 0,
    explanation: 'Supplementary angles sum to 180°: x + y = 180 and x - y = 18. Adding gives 2x = 198 ⇒ x = 99°, and y = 81°.'
  },
  {
    id: 'aq-10',
    number: 10,
    topic: 'Cross-Multiplication & Parameter k Problems',
    question: 'In the cross-multiplication formula x / (b₁c₂ - b₂c₁) = y / (c₁a₂ - c₂a₁) = 1 / (a₁b₂ - a₂b₁) for a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0, what must be true for a unique solution?',
    options: [
      'a₁b₂ - a₂b₁ = 0',
      'a₁b₂ - a₂b₁ ≠ 0',
      'b₁c₂ - b₂c₁ = 0',
      'c₁a₂ - c₂a₁ = 0'
    ],
    correctIndex: 1,
    explanation: 'For x and y to be well-defined finite real numbers, the denominator (a₁b₂ - a₂b₁) must be non-zero, which is equivalent to a₁/a₂ ≠ b₁/b₂.'
  }
];

// ============================================================================
// ARENA CHALLENGES & ACHIEVEMENT BADGES
// ============================================================================

interface ArenaItem {
  id: string;
  tier: 'Cadet' | 'Scholar' | 'Olympiad';
  points: number;
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
}

const ARENA_ITEMS: ArenaItem[] = [
  {
    id: 'ar-1',
    tier: 'Cadet',
    points: 10,
    question: 'Rapid Ratio Check: How many solutions does 3x + 5y = 12 and 6x + 10y = 24 have?',
    options: ['Unique solution (1)', 'No solution (0)', 'Infinitely many solutions (∞)', 'Exactly 2 solutions'],
    correctIndex: 2,
    feedback: '3/6 = 5/10 = 12/24 = 1/2! Equal ratios across all three terms mean Coincident Lines (∞ solutions).'
  },
  {
    id: 'ar-2',
    tier: 'Cadet',
    points: 10,
    question: 'Intercept Sprint: Where does the line 4x - 3y = 12 cross the X-axis?',
    options: ['(0, -4)', '(3, 0)', '(-3, 0)', '(4, 0)'],
    correctIndex: 1,
    feedback: 'On the X-axis, y = 0. So 4x = 12 ⇒ x = 3, giving the point (3, 0).'
  },
  {
    id: 'ar-3',
    tier: 'Cadet',
    points: 10,
    question: 'Mental Elimination: If x + y = 20 and x - y = 6, what is (x, y)?',
    options: ['(13, 7)', '(14, 6)', '(12, 8)', '(15, 5)'],
    correctIndex: 0,
    feedback: 'x = (20 + 6)/2 = 13 and y = (20 - 6)/2 = 7.'
  },
  {
    id: 'ar-4',
    tier: 'Scholar',
    points: 20,
    question: 'Parameter Puzzle: Find k so that kx + 2y = 5 and 3x + y = 1 has NO solution.',
    options: ['k = 3', 'k = 6', 'k = 1.5', 'k = -6'],
    correctIndex: 1,
    feedback: 'For parallel lines, k/3 = 2/1 ≠ 5/1 ⇒ k = 6.'
  },
  {
    id: 'ar-5',
    tier: 'Scholar',
    points: 20,
    question: 'Fraction Word Problem: A fraction becomes 4/5 if 1 is added to both numerator (x) and denominator (y). Which equation represents this?',
    options: ['5x - 4y = -1', '4x - 5y = 1', '5x + 4y = -1', 'x + y = 9'],
    correctIndex: 0,
    feedback: '(x + 1)/(y + 1) = 4/5 ⇒ 5(x + 1) = 4(y + 1) ⇒ 5x + 5 = 4y + 4 ⇒ 5x - 4y = -1.'
  },
  {
    id: 'ar-6',
    tier: 'Scholar',
    points: 20,
    question: 'Origin Check: Which of these lines passes directly through the origin (0, 0)?',
    options: ['2x + 3y = 6', 'x - y = 1', '5x - 7y = 0', 'x = 4'],
    correctIndex: 2,
    feedback: 'A linear equation ax + by = c passes through (0, 0) if and only if its constant term c = 0!'
  },
  {
    id: 'ar-7',
    tier: 'Olympiad',
    points: 30,
    question: 'Cyclic System: If 99x + 101y = 499 and 101x + 99y = 501, what is the value of (x - y)?',
    options: ['1', '-1', '2', '2.5'],
    correctIndex: 1,
    feedback: 'Subtract Eq(1) from Eq(2): (101 - 99)x + (99 - 101)y = 501 - 499 ⇒ 2x - 2y = 2 ⇒ x - y = 1... Wait: 99x - 101x is -2x, so (101x + 99y) - (99x + 101y) = 2x - 2y = 2 ⇒ x - y = 1! Hold on: let us check (3, 2): 99(3)+101(2) = 297+202 = 499 and 101(3)+99(2) = 303+198 = 501. Here x = 3, y = 2 so x - y = +1!'
  },
  {
    id: 'ar-8',
    tier: 'Olympiad',
    points: 30,
    question: 'Triangle Vertices: What is the y-coordinate of the vertex where 3x + y - 12 = 0 and x - 3y + 6 = 0 intersect?',
    options: ['y = 3', 'y = 4', 'y = 2', 'y = 6'],
    correctIndex: 0,
    feedback: 'From x = 3y - 6, substitute into 3(3y - 6) + y = 12 ⇒ 10y - 18 = 12 ⇒ 10y = 30 ⇒ y = 3 (and x = 3).'
  }
];
// Fix ar-7 correctIndex to 0 ('1') so it's 100% mathematically exact!
ARENA_ITEMS[6].correctIndex = 0;

interface BadgeDef {
  id: string;
  title: string;
  description: string;
  iconName: string;
  checkUnlocked: (p: StudentProgress) => boolean;
}

const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: 'badge-graph-explorer',
    title: 'Graph Explorer',
    description: 'Explore all 3 graphical solution cases in the Interactive Graph Laboratory',
    iconName: 'Compass',
    checkUnlocked: (p) => p.labPresetsExplored.length >= 3
  },
  {
    id: 'badge-concept-scholar',
    title: 'NCERT Concept Scholar',
    description: 'Complete at least 4 conceptual lessons in the Learn module',
    iconName: 'BookOpen',
    checkUnlocked: (p) => p.completedConcepts.length >= 4
  },
  {
    id: 'badge-algebra-architect',
    title: 'Algebra Architect',
    description: 'Explore all 3 algebraic methods (Substitution, Elimination & Cross-Multiplication) in the Solver',
    iconName: 'Calculator',
    checkUnlocked: (p) => p.solverMethodsUsed.length >= 3
  },
  {
    id: 'badge-streak-blazer',
    title: 'Streak Blazer',
    description: 'Achieve a streak of 3 or more consecutive correct answers in the Arena',
    iconName: 'Flame',
    checkUnlocked: (p) => p.arenaBestStreak >= 3
  },
  {
    id: 'badge-daily-champion',
    title: 'Daily Challenge Champion',
    description: 'Solve the NCERT Daily Word Problem Challenge in the Arena',
    iconName: 'Zap',
    checkUnlocked: (p) => p.dailyChallengeCompleted
  },
  {
    id: 'badge-grandmaster',
    title: 'Chapter 3 Grandmaster',
    description: 'Score 80% or higher on the 10-question Final Assessment',
    iconName: 'Trophy',
    checkUnlocked: (p) => p.assessmentAttempts.some((a) => a.percentage >= 80)
  }
];

const INITIAL_PROGRESS: StudentProgress = {
  studentName: 'Aarav Sharma (Class 10)',
  completedConcepts: ['c1-linear-two-vars'],
  labPresetsExplored: ['case1'],
  solverMethodsUsed: ['substitution'],
  practiceSolvedIds: [],
  practiceAttempts: 0,
  arenaPoints: 20,
  arenaStreak: 1,
  arenaBestStreak: 1,
  dailyChallengeCompleted: false,
  unlockedBadges: [],
  assessmentAttempts: []
};

const STORAGE_KEY = 'mathlab_iitkgp_progress_v1';

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Navigation & UI state
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student Progress State (synced with LocalStorage safely)
  const [progress, setProgress] = useState<StudentProgress>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_PROGRESS, ...parsed };
      }
    } catch {
      // Fallback to in-memory state if localStorage is restricted
    }
    return INITIAL_PROGRESS;
  });

  // Save to LocalStorage and auto-compute unlocked badges
  useEffect(() => {
    const newlyUnlocked = BADGE_DEFINITIONS.filter((b) => b.checkUnlocked(progress)).map((b) => b.id);
    const currentSet = new Set(progress.unlockedBadges);
    const hasNew = newlyUnlocked.some((id) => !currentSet.has(id));

    if (hasNew) {
      const merged = Array.from(new Set([...progress.unlockedBadges, ...newlyUnlocked]));
      const newlyAddedBadge = BADGE_DEFINITIONS.find((b) => !currentSet.has(b.id) && newlyUnlocked.includes(b.id));
      if (newlyAddedBadge) {
        triggerToast(`Badge Unlocked: ${newlyAddedBadge.title}!`);
      }
      setProgress((prev) => ({ ...prev, unlockedBadges: merged }));
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota / iframe restriction errors
    }
  }, [progress]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Shared equation state that can be sent from Graph Lab -> Step-by-Step Solver
  const [labSystem, setLabSystem] = useState<LinearSystem>({
    a1: 2,
    b1: 1,
    c1: 7,
    a2: 1,
    b2: -1,
    c2: 2
  });
  const [solverSystem, setSolverSystem] = useState<LinearSystem>({
    a1: 2,
    b1: 1,
    c1: 7,
    a2: 1,
    b2: -1,
    c2: 2
  });

  // Learn Module State
  const [selectedConceptId, setSelectedConceptId] = useState<string>(CONCEPT_LESSONS[0].id);

  const navigateToLearnTopic = (topicKeyword: string) => {
    if (topicKeyword.includes('Graph')) setSelectedConceptId('c2-graphical-rep');
    else if (topicKeyword.includes('Ratio') || topicKeyword.includes('Consistency')) setSelectedConceptId('c7-consistency');
    else if (topicKeyword.includes('Substitution') || topicKeyword.includes('Elimination')) setSelectedConceptId('c8-algebraic-methods');
    else if (topicKeyword.includes('Cross')) setSelectedConceptId('c5-no-solution');
    else setSelectedConceptId('c3-pair-of-equations');
    setActiveModule('learn');
  };

  // Compute overall mastery percentage
  const overallProgressPercent = useMemo(() => {
    const conceptWeight = (progress.completedConcepts.length / CONCEPT_LESSONS.length) * 35;
    const labWeight = (Math.min(progress.labPresetsExplored.length, 3) / 3) * 15;
    const solverWeight = (Math.min(progress.solverMethodsUsed.length, 3) / 3) * 15;
    const practiceWeight = (Math.min(progress.practiceSolvedIds.length, PRACTICE_QUESTIONS.length) / PRACTICE_QUESTIONS.length) * 20;
    const bestAssessment = progress.assessmentAttempts.reduce((max, a) => Math.max(max, a.percentage), 0);
    const assessmentWeight = (bestAssessment / 100) * 15;
    return Math.min(100, Math.round(conceptWeight + labWeight + solverWeight + practiceWeight + assessmentWeight));
  }, [progress]);

  const handleResetProgress = () => {
    const fresh: StudentProgress = {
      studentName: progress.studentName,
      completedConcepts: [],
      labPresetsExplored: [],
      solverMethodsUsed: [],
      practiceSolvedIds: [],
      practiceAttempts: 0,
      arenaPoints: 0,
      arenaStreak: 0,
      arenaBestStreak: 0,
      dailyChallengeCompleted: false,
      unlockedBadges: [],
      assessmentAttempts: []
    };
    setProgress(fresh);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
    setShowResetModal(false);
    triggerToast('All student progress has been reset.');
  };

  const navItems: { id: ModuleId; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home Dashboard', shortLabel: 'Home', icon: Home },
    { id: 'learn', label: 'Learn Concepts', shortLabel: 'Learn', icon: BookOpen },
    { id: 'lab', label: 'Graph Laboratory', shortLabel: 'Graph Lab', icon: Compass },
    { id: 'solver', label: 'Step-by-Step Solver', shortLabel: 'Solver', icon: Calculator },
    { id: 'practice', label: 'Practice Zone', shortLabel: 'Practice', icon: Target },
    { id: 'arena', label: 'Challenge Arena', shortLabel: 'Arena', icon: Trophy },
    { id: 'assessment', label: 'Final Assessment', shortLabel: 'Assessment', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Academic Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <button
              type="button"
              onClick={() => setActiveModule('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    MathLab
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    NCERT Class 10
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden md:block">
                  Explore, Visualize &amp; Master Mathematics • IIT Kharagpur ICT in Education
                </p>
              </div>
            </button>

            {/* Desktop Navigation Pills */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModule(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Live XP, Streak & Progress Pill */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
                <span className="flex items-center gap-1 text-amber-600" title="Arena Streak">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {progress.arenaStreak}
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-purple-700" title="Total XP Points">
                  <Sparkles className="w-3.5 h-3.5" />
                  {progress.arenaPoints} XP
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-blue-700" title="Chapter Mastery">
                  {overallProgressPercent}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-sm font-medium animate-bounce">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeModule === 'dashboard' && (
          <DashboardModule
            progress={progress}
            overallProgressPercent={overallProgressPercent}
            setActiveModule={setActiveModule}
            editingName={editingName}
            setEditingName={setEditingName}
            nameInput={nameInput}
            setNameInput={setNameInput}
            onSaveName={(newName) => {
              if (newName.trim()) {
                setProgress((prev) => ({ ...prev, studentName: newName.trim() }));
                triggerToast('Student profile updated!');
              }
              setEditingName(false);
            }}
            onOpenResetModal={() => setShowResetModal(true)}
          />
        )}

        {activeModule === 'learn' && (
          <LearnModule
            selectedConceptId={selectedConceptId}
            setSelectedConceptId={setSelectedConceptId}
            completedConcepts={progress.completedConcepts}
            onToggleComplete={(conceptId) => {
              setProgress((prev) => {
                const exists = prev.completedConcepts.includes(conceptId);
                const updated = exists
                  ? prev.completedConcepts.filter((id) => id !== conceptId)
                  : [...prev.completedConcepts, conceptId];
                return {
                  ...prev,
                  completedConcepts: updated,
                  arenaPoints: exists ? prev.arenaPoints : prev.arenaPoints + 15
                };
              });
              triggerToast('Concept progress saved (+15 XP)!');
            }}
            onOpenInLab={(sys) => {
              setLabSystem(sys);
              setActiveModule('lab');
              triggerToast('Loaded concept example into Graph Laboratory!');
            }}
          />
        )}

        {activeModule === 'lab' && (
          <GraphLabModule
            system={labSystem}
            setSystem={setLabSystem}
            exploredPresets={progress.labPresetsExplored}
            onMarkPresetExplored={(presetId) => {
              if (!progress.labPresetsExplored.includes(presetId)) {
                setProgress((prev) => ({
                  ...prev,
                  labPresetsExplored: [...prev.labPresetsExplored, presetId],
                  arenaPoints: prev.arenaPoints + 10
                }));
              }
            }}
            onSendToSolver={(sys) => {
              setSolverSystem(sys);
              setActiveModule('solver');
              triggerToast('Equations sent to Step-by-Step Algebraic Solver!');
            }}
          />
        )}

        {activeModule === 'solver' && (
          <StepByStepSolverModule
            system={solverSystem}
            setSystem={setSolverSystem}
            methodsUsed={progress.solverMethodsUsed}
            onMarkMethodUsed={(m) => {
              if (!progress.solverMethodsUsed.includes(m)) {
                setProgress((prev) => ({
                  ...prev,
                  solverMethodsUsed: [...prev.solverMethodsUsed, m],
                  arenaPoints: prev.arenaPoints + 10
                }));
              }
            }}
            onOpenInLab={(sys) => {
              setLabSystem(sys);
              setActiveModule('lab');
            }}
          />
        )}

        {activeModule === 'practice' && (
          <PracticeZoneModule
            solvedIds={progress.practiceSolvedIds}
            onRecordAttempt={(questionId, isCorrect) => {
              setProgress((prev) => {
                const alreadySolved = prev.practiceSolvedIds.includes(questionId);
                return {
                  ...prev,
                  practiceAttempts: prev.practiceAttempts + 1,
                  practiceSolvedIds:
                    isCorrect && !alreadySolved
                      ? [...prev.practiceSolvedIds, questionId]
                      : prev.practiceSolvedIds,
                  arenaPoints: isCorrect && !alreadySolved ? prev.arenaPoints + 15 : prev.arenaPoints
                };
              });
            }}
            onOpenInLab={(sys) => {
              setLabSystem(sys);
              setActiveModule('lab');
            }}
          />
        )}

        {activeModule === 'arena' && (
          <ChallengeArenaModule
            progress={progress}
            onAnswerArena={(pointsEarned, isCorrect) => {
              setProgress((prev) => {
                const newStreak = isCorrect ? prev.arenaStreak + 1 : 0;
                const newBest = Math.max(prev.arenaBestStreak, newStreak);
                return {
                  ...prev,
                  arenaPoints: prev.arenaPoints + (isCorrect ? pointsEarned : 0),
                  arenaStreak: newStreak,
                  arenaBestStreak: newBest
                };
              });
            }}
            onCompleteDailyChallenge={() => {
              if (!progress.dailyChallengeCompleted) {
                setProgress((prev) => ({
                  ...prev,
                  dailyChallengeCompleted: true,
                  arenaPoints: prev.arenaPoints + 50,
                  arenaStreak: prev.arenaStreak + 1,
                  arenaBestStreak: Math.max(prev.arenaBestStreak, prev.arenaStreak + 1)
                }));
                triggerToast('Daily Challenge Mastered! +50 Bonus XP!');
              }
            }}
          />
        )}

        {activeModule === 'assessment' && (
          <AssessmentModule
            attempts={progress.assessmentAttempts}
            onSaveAssessment={(attempt) => {
              setProgress((prev) => ({
                ...prev,
                assessmentAttempts: [attempt, ...prev.assessmentAttempts],
                arenaPoints: prev.arenaPoints + attempt.score * 10
              }));
              triggerToast(`Assessment Saved: ${attempt.score}/${attempt.total} (${attempt.percentage}%)`);
            }}
            onNavigateToTopic={navigateToLearnTopic}
            onOpenLab={() => setActiveModule('lab')}
          />
        )}
      </main>

      {/* Reset Confirmation Modal (No browser confirm() blocked in Canvas) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Reset Learning Progress?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This will clear your completed concepts, solved practice problems, Arena XP, streak, and assessment history from LocalStorage so you can test the application from a clean slate.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetProgress}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>
              <strong className="text-slate-700">MathLab</strong> • Undergraduate Course Project: <em>ICT in Education</em> • IIT Kharagpur
            </span>
          </div>
          <div>
            NCERT / CBSE Class 10 Mathematics • Chapter 3: Pair of Linear Equations in Two Variables
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// MODULE A: HOME DASHBOARD
// ============================================================================

interface DashboardProps {
  progress: StudentProgress;
  overallProgressPercent: number;
  setActiveModule: (m: ModuleId) => void;
  editingName: boolean;
  setEditingName: (v: boolean) => void;
  nameInput: string;
  setNameInput: (v: string) => void;
  onSaveName: (name: string) => void;
  onOpenResetModal: () => void;
}

function DashboardModule({
  progress,
  overallProgressPercent,
  setActiveModule,
  editingName,
  setEditingName,
  nameInput,
  setNameInput,
  onSaveName,
  onOpenResetModal
}: DashboardProps) {
  const bestAssessment = progress.assessmentAttempts.reduce(
    (max, a) => Math.max(max, a.percentage),
    0
  );

  const learningObjectives = [
    {
      title: 'Formulate & Represent Linear Systems',
      desc: 'Translate real-world problems into pairs of linear equations a₁x + b₁y = c₁ and a₂x + b₂y = c₂.',
      done: progress.completedConcepts.includes('c3-pair-of-equations')
    },
    {
      title: 'Visualize Geometric Solutions on the Cartesian Plane',
      desc: 'Distinguish Intersecting (unique), Parallel (no solution), and Coincident (infinite) lines.',
      done: progress.labPresetsExplored.length >= 3
    },
    {
      title: 'Apply Coefficient Ratio Criteria for Consistency',
      desc: 'Test a₁/a₂, b₁/b₂, and c₁/c₂ to classify systems as Consistent or Inconsistent without plotting.',
      done: progress.completedConcepts.includes('c7-consistency')
    },
    {
      title: 'Master Algebraic Solution Techniques',
      desc: 'Solve simultaneous equations accurately using Substitution, Elimination, and Cross-Multiplication.',
      done: progress.solverMethodsUsed.length >= 3
    }
  ];

  const moduleCards: {
    id: ModuleId;
    badge: string;
    title: string;
    desc: string;
    stat: string;
    accent: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'learn',
      badge: 'Module B • 8 NCERT Topics',
      title: 'Conceptual Learning Module',
      desc: 'Interactive lessons with visual illustrations, worked step-by-step examples, and misconception alerts.',
      stat: `${progress.completedConcepts.length} / ${CONCEPT_LESSONS.length} Mastered`,
      accent: 'from-blue-600 to-indigo-600',
      icon: BookOpen
    },
    {
      id: 'lab',
      badge: 'Module C • Core Interactive Lab',
      title: 'Interactive Graph Laboratory',
      desc: 'Manipulate live sliders for a₁, b₁, c₁ & a₂, b₂, c₂ and observe dynamic intersection & ratio geometry.',
      stat: `${progress.labPresetsExplored.length} / 3 Cases Explored`,
      accent: 'from-purple-600 to-fuchsia-600',
      icon: Compass
    },
    {
      id: 'solver',
      badge: 'Module D • 3 Algebraic Engines',
      title: 'Step-by-Step Algebraic Solver',
      desc: 'Enter any pair of linear equations to inspect Substitution, Elimination & Cross-Multiplication steps.',
      stat: `${progress.solverMethodsUsed.length} / 3 Methods Tried`,
      accent: 'from-indigo-600 to-blue-700',
      icon: Calculator
    },
    {
      id: 'practice',
      badge: 'Module E • Adaptive Scaffolding',
      title: 'Guided Practice Zone',
      desc: 'Beginner, Intermediate & Advanced problems with progressive hints and mistake diagnostics.',
      stat: `${progress.practiceSolvedIds.length} / ${PRACTICE_QUESTIONS.length} Solved`,
      accent: 'from-emerald-600 to-teal-600',
      icon: Target
    },
    {
      id: 'arena',
      badge: 'Module F • Gamified Mastery',
      title: 'Gamified Challenge Arena',
      desc: 'Earn XP points, build streaks, unlock 6 achievement badges, and conquer the Daily Challenge.',
      stat: `${progress.arenaPoints} XP • ${progress.unlockedBadges.length}/6 Badges`,
      accent: 'from-amber-500 to-orange-600',
      icon: Trophy
    },
    {
      id: 'assessment',
      badge: 'Module G • Analytics & Revision',
      title: 'Assessment & Performance Dashboard',
      desc: '10-question NCERT exam with topic-wise accuracy charts and personalized revision diagnostics.',
      stat: progress.assessmentAttempts.length > 0 ? `Best Score: ${bestAssessment}%` : 'Not Attempted Yet',
      accent: 'from-rose-600 to-purple-700',
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white p-6 sm:p-10 shadow-lg border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CBSE / NCERT Class 10 Mathematics • Chapter 3</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Pair of Linear Equations in Two Variables
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Welcome back,{' '}
              {!editingName ? (
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(progress.studentName);
                    setEditingName(true);
                  }}
                  className="font-bold text-white underline decoration-blue-400 decoration-dashed underline-offset-4 hover:text-blue-200"
                  title="Click to edit student name"
                >
                  {progress.studentName}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-blue-400 text-white text-sm"
                    aria-label="Student name"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveName(nameInput)}
                    className="px-2 py-0.5 rounded bg-blue-600 text-xs font-semibold hover:bg-blue-500"
                  >
                    Save
                  </button>
                </span>
              )}
              ! Move beyond passive textbook reading—experiment with live Cartesian graphs, test coefficient ratios, and master algebraic problem-solving through constructivist discovery.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActiveModule('learn')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Learning</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('lab')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Graph Laboratory</span>
              </button>
              <button
                type="button"
                onClick={onOpenResetModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Progress</span>
              </button>
            </div>
          </div>

          {/* Interactive Hero Preview Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-300 font-bold">
                  Your Learning Mastery
                </span>
                <div className="text-3xl font-extrabold text-white mt-0.5">
                  {overallProgressPercent}% Complete
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-300" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 transition-all duration-500"
                style={{ width: `${Math.max(4, overallProgressPercent)}%` }}
              />
            </div>

            {/* 4 Mini Metrics */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Concepts Mastered</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {progress.completedConcepts.length} / {CONCEPT_LESSONS.length}
                </div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Practice Solved</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {progress.practiceSolvedIds.length} / {PRACTICE_QUESTIONS.length}
                </div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Arena XP &amp; Streak</div>
                <div className="text-lg font-bold text-amber-300 mt-0.5">
                  {progress.arenaPoints} XP ({progress.arenaStreak}🔥)
                </div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Assessment High</div>
                <div className="text-lg font-bold text-emerald-300 mt-0.5">
                  {progress.assessmentAttempts.length > 0 ? `${bestAssessment}%` : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter Introduction & Learning Objectives */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
              <Lightbulb className="w-4 h-4" />
              <span>Chapter Introduction: Why Two Variables?</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              From Single Unknowns to Simultaneous Relationships
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In Class 9, you studied how a single linear equation like <span className="font-mono font-semibold text-slate-800">2x + 3y = 12</span> has infinitely many solutions lying on a straight line.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              In real life—whether comparing two metro fare plans, blending two chemical solutions, or finding boat speed in a flowing river—two conditions act on the <strong>same two unknowns simultaneously</strong>. By pairing two linear equations together, we unlock the power to pinpoint where two linear relationships intersect!
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              The 3 Core Ratio Laws You Will Discover
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-700">a₁/a₂ ≠ b₁/b₂</span>
                <span className="text-slate-600">Intersecting • Unique Solution</span>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="font-bold text-rose-700">a₁/a₂ = b₁/b₂ ≠ c₁/c₂</span>
                <span className="text-slate-600">Parallel • No Solution</span>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="font-bold text-purple-700">a₁/a₂ = b₁/b₂ = c₁/c₂</span>
                <span className="text-slate-600">Coincident • ∞ Solutions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Objectives Checklist */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Curriculum Alignment
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                NCERT Chapter 3 Learning Objectives
              </h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {learningObjectives.filter((o) => o.done).length} / 4 Achieved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {learningObjectives.map((obj, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  obj.done
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      obj.done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{obj.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{obj.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pedagogical Design Strip */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Educational Pedagogy Built-In:</span>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">Constructivist Discovery</span>
            <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium">Experiential Graph Lab</span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium">Progressive Scaffolding</span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-medium">Mastery Learning</span>
          </div>
        </div>
      </section>

      {/* Navigation Grid to All 6 Learning Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore Interactive Learning Modules</h2>
            <p className="text-xs text-slate-500">
              Select any module below to begin experimenting, solving, or testing your mastery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {moduleCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {card.badge}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.accent} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{card.stat}</span>
                  <button
                    type="button"
                    onClick={() => setActiveModule(card.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// MODULE B: LEARN – CONCEPTUAL LEARNING MODULE
// ============================================================================

interface LearnModuleProps {
  selectedConceptId: string;
  setSelectedConceptId: (id: string) => void;
  completedConcepts: string[];
  onToggleComplete: (id: string) => void;
  onOpenInLab: (sys: LinearSystem) => void;
}

function LearnModule({
  selectedConceptId,
  setSelectedConceptId,
  completedConcepts,
  onToggleComplete,
  onOpenInLab
}: LearnModuleProps) {
  const currentLesson =
    CONCEPT_LESSONS.find((c) => c.id === selectedConceptId) || CONCEPT_LESSONS[0];
  const currentIndex = CONCEPT_LESSONS.findIndex((c) => c.id === currentLesson.id);

  // Interactive states inside the Learn module
  const [expandedStep, setExpandedStep] = useState<number>(currentLesson.exampleProblem.steps.length);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [testX, setTestX] = useState<number>(2);
  const [testY, setTestY] = useState<number>(3);

  // Reset local interactive state when switching concepts
  useEffect(() => {
    setExpandedStep(currentLesson.exampleProblem.steps.length);
    setSelectedQuizOption(null);
  }, [currentLesson.id, currentLesson.exampleProblem.steps.length]);

  const isCompleted = completedConcepts.includes(currentLesson.id);
  const lhsVal =
    currentLesson.exampleProblem.system.a1 * testX +
    currentLesson.exampleProblem.system.b1 * testY;
  const rhsVal = currentLesson.exampleProblem.system.c1;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <BookOpen className="w-4 h-4" />
            <span>Module B • Conceptual Learning &amp; Guided Examples</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            NCERT Class 10 Chapter 3 Concept Explorer
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {completedConcepts.length} of {CONCEPT_LESSONS.length} Concepts Mastered
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: 8 Concept Lessons */}
        <aside className="lg:col-span-4 space-y-2">
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1.5">
            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Chapter 3 Topics (Select to Study)
            </div>
            {CONCEPT_LESSONS.map((lesson) => {
              const active = lesson.id === currentLesson.id;
              const done = completedConcepts.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setSelectedConceptId(lesson.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      active
                        ? 'bg-white/20 text-white'
                        : done
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : lesson.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-snug">{lesson.title}</div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        active ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {lesson.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content Area: Active Concept Lesson */}
        <div className="lg:col-span-8 space-y-6">
          {/* Concept Main Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            {/* Title & Mark Mastered Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700">
                  Section {currentLesson.number}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {currentLesson.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentLesson.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleComplete(currentLesson.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Concept Mastered ✓' : 'Mark as Mastered (+15 XP)'}</span>
              </button>
            </div>

            {/* Key Mathematical Formula Highlight */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800">
              <div className="text-[11px] uppercase tracking-wider text-blue-300 font-bold mb-1">
                Core Mathematical Identity / Rule
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-amber-300 tracking-wide">
                {currentLesson.keyFormula}
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {currentLesson.summary}
              </p>
            </div>

            {/* Student-Friendly Bullet Points (Not Textbook Paragraphs) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Key Conceptual Insights</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {currentLesson.ncertExplanation.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-World Context Box */}
            <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-200 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                  Real-World NCERT Application
                </div>
                <p className="text-xs sm:text-sm text-indigo-950 mt-1 leading-relaxed">
                  {currentLesson.realWorldContext}
                </p>
              </div>
            </div>

            {/* Interactive Visual Illustration + Live Solution Tester */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="md:col-span-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Visual Geometric Illustration
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenInLab(currentLesson.exampleProblem.system)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <span>Explore in Graph Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <MiniCartesianPlot system={currentLesson.exampleProblem.system} height={210} />
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Interactive Point Tester (Constructivist Sandbox)
                  </div>
                  <p className="text-xs text-slate-600">
                    Test any values of <strong className="font-mono">x</strong> and <strong className="font-mono">y</strong> in Equation 1:{' '}
                    <span className="font-mono font-bold text-blue-700">
                      {formatLinearEquation(
                        currentLesson.exampleProblem.system.a1,
                        currentLesson.exampleProblem.system.b1,
                        currentLesson.exampleProblem.system.c1
                      )}
                    </span>
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Try x = {testX}
                      </label>
                      <input
                        type="range"
                        min={-5}
                        max={10}
                        step={1}
                        value={testX}
                        onChange={(e) => setTestX(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Try y = {testY}
                      </label>
                      <input
                        type="range"
                        min={-5}
                        max={10}
                        step={1}
                        value={testY}
                        onChange={(e) => setTestY(Number(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs font-mono ${
                    Math.abs(lhsVal - rhsVal) < EPSILON
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div>
                    LHS = ({currentLesson.exampleProblem.system.a1})({testX}) + (
                    {currentLesson.exampleProblem.system.b1})({testY}) = <strong>{lhsVal}</strong>
                  </div>
                  <div>
                    RHS = <strong>{rhsVal}</strong>
                  </div>
                  <div className="mt-1 font-sans font-bold">
                    {Math.abs(lhsVal - rhsVal) < EPSILON
                      ? `✓ LHS = RHS! (${testX}, ${testY}) lies ON the line!`
                      : `✗ LHS ≠ RHS. (${testX}, ${testY}) is NOT on the line.`}
                  </div>
                </div>
              </div>
            </div>

            {/* Worked Mathematical Example with Step-by-Step Scaffolding */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Worked Mathematical Example &amp; Step-by-Step Solution
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedStep(1)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100"
                  >
                    Step 1 Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedStep(currentLesson.exampleProblem.steps.length)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50"
                  >
                    Show All Steps
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl text-sm font-medium">
                <span className="text-blue-300 font-bold">Problem: </span>
                {currentLesson.exampleProblem.question}
              </div>

              <div className="space-y-2.5">
                {currentLesson.exampleProblem.steps.slice(0, expandedStep).map((st, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="text-xs font-bold text-blue-700">
                      Step {i + 1}: {st.title}
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                      {st.math}
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-700">Why: </strong>
                      {st.reason}
                    </p>
                  </div>
                ))}

                {expandedStep < currentLesson.exampleProblem.steps.length && (
                  <button
                    type="button"
                    onClick={() => setExpandedStep((s) => s + 1)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-blue-400 text-blue-700 bg-blue-50/50 hover:bg-blue-50 text-xs font-bold"
                  >
                    Reveal Next Step ({expandedStep + 1} of {currentLesson.exampleProblem.steps.length})
                  </button>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold text-emerald-900">
                <strong>Conclusion: </strong>
                {currentLesson.exampleProblem.conclusion}
              </div>
            </div>

            {/* Common Misconception Alert Box */}
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Common Student Misconception Alert</span>
              </div>
              <div className="text-xs sm:text-sm text-rose-950 font-semibold">
                ✗ Myth: {currentLesson.misconception.myth}
              </div>
              <div className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-xl border border-rose-100">
                <strong className="text-emerald-700">✓ Mathematical Reality: </strong>
                {currentLesson.misconception.reality}
              </div>
            </div>

            {/* Embedded Quick Concept Check */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Immediate Concept Check</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {currentLesson.quickCheck.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentLesson.quickCheck.options.map((opt, idx) => {
                  const isSelected = selectedQuizOption === idx;
                  const isCorrect = idx === currentLesson.quickCheck.correctIndex;
                  let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-blue-400';
                  if (selectedQuizOption !== null) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedQuizOption(idx);
                        if (idx === currentLesson.quickCheck.correctIndex && !isCompleted) {
                          onToggleComplete(currentLesson.id);
                        }
                      }}
                      className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {selectedQuizOption !== null && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedQuizOption !== null && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    selectedQuizOption === currentLesson.quickCheck.correctIndex
                      ? 'bg-emerald-100/70 text-emerald-950 border border-emerald-300'
                      : 'bg-amber-100/70 text-amber-950 border border-amber-300'
                  }`}
                >
                  <strong>
                    {selectedQuizOption === currentLesson.quickCheck.correctIndex
                      ? 'Correct! '
                      : 'Not quite — think about this: '}
                  </strong>
                  {currentLesson.quickCheck.explanation}
                </div>
              )}
            </div>

            {/* Previous / Next Concept Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() =>
                  currentIndex > 0 && setSelectedConceptId(CONCEPT_LESSONS[currentIndex - 1].id)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                ← Previous Concept
              </button>
              <button
                type="button"
                disabled={currentIndex === CONCEPT_LESSONS.length - 1}
                onClick={() =>
                  currentIndex < CONCEPT_LESSONS.length - 1 &&
                  setSelectedConceptId(CONCEPT_LESSONS[currentIndex + 1].id)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 cursor-pointer"
              >
                Next Concept →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE MINI CARTESIAN PLOT FOR LEARN & PRACTICE MODULES
// ============================================================================

function MiniCartesianPlot({ system, height = 220 }: { system: LinearSystem; height?: number }) {
  const analysis = useMemo(() => analyzeLinearSystem(system), [system]);
  const range = useMemo(() => {
    if (analysis.intersection) {
      const maxCoord = Math.max(Math.abs(analysis.intersection.x), Math.abs(analysis.intersection.y));
      if (maxCoord > 7) return Math.ceil(maxCoord * 1.4);
    }
    return 8;
  }, [analysis]);

  const size = 260;
  const pad = 24;
  const plotSize = size - 2 * pad;

  const toSvgX = (x: number) => pad + ((x + range) / (2 * range)) * plotSize;
  const toSvgY = (y: number) => pad + ((range - y) / (2 * range)) * plotSize;

  const seg1 = computeLineSegment(system.a1, system.b1, system.c1, range);
  const seg2 = computeLineSegment(system.a2, system.b2, system.c2, range);

  const ticks = [-range, -Math.round(range / 2), 0, Math.round(range / 2), range];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxHeight: `${height}px` }}
        className="w-full h-auto select-none"
      >
        <defs>
          <clipPath id="mini-plot-clip">
            <rect x={pad} y={pad} width={plotSize} height={plotSize} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={toSvgX(t)}
              y1={pad}
              x2={toSvgX(t)}
              y2={size - pad}
              stroke={t === 0 ? '#334155' : '#e2e8f0'}
              strokeWidth={t === 0 ? 1.5 : 1}
            />
            <line
              x1={pad}
              y1={toSvgY(t)}
              x2={size - pad}
              y2={toSvgY(t)}
              stroke={t === 0 ? '#334155' : '#e2e8f0'}
              strokeWidth={t === 0 ? 1.5 : 1}
            />
            {t !== 0 && (
              <>
                <text
                  x={toSvgX(t)}
                  y={toSvgY(0) + 11}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#64748b"
                >
                  {t}
                </text>
                <text
                  x={toSvgX(0) - 5}
                  y={toSvgY(t) + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="#64748b"
                >
                  {t}
                </text>
              </>
            )}
          </g>
        ))}

        {/* Plotted Lines */}
        <g clipPath="url(#mini-plot-clip)">
          {seg1 && (
            <line
              x1={toSvgX(seg1[0].x)}
              y1={toSvgY(seg1[0].y)}
              x2={toSvgX(seg1[1].x)}
              y2={toSvgY(seg1[1].y)}
              stroke="#2563eb"
              strokeWidth="2.5"
            />
          )}
          {seg2 && (
            <line
              x1={toSvgX(seg2[0].x)}
              y1={toSvgY(seg2[0].y)}
              x2={toSvgX(seg2[1].x)}
              y2={toSvgY(seg2[1].y)}
              stroke="#9333ea"
              strokeWidth="2.5"
              strokeDasharray={analysis.type === 'infinite' ? '5,4' : undefined}
            />
          )}
          {analysis.intersection && (
            <g>
              <circle
                cx={toSvgX(analysis.intersection.x)}
                cy={toSvgY(analysis.intersection.y)}
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={toSvgX(analysis.intersection.x) + 7}
                y={toSvgY(analysis.intersection.y) - 6}
                fontSize="9"
                fontWeight="bold"
                fill="#065f46"
              >
                ({formatNumber(analysis.intersection.x, 1)}, {formatNumber(analysis.intersection.y, 1)})
              </text>
            </g>
          )}
        </g>
      </svg>
      <div className="flex items-center gap-4 text-[11px] font-semibold mt-1">
        <span className="flex items-center gap-1 text-blue-600">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          L₁: {formatLinearEquation(system.a1, system.b1, system.c1)}
        </span>
        <span className="flex items-center gap-1 text-purple-600">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
          L₂: {formatLinearEquation(system.a2, system.b2, system.c2)}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE C: INTERACTIVE GRAPH LABORATORY (MOST IMPORTANT FEATURE)
// ============================================================================

interface GraphLabProps {
  system: LinearSystem;
  setSystem: React.Dispatch<React.SetStateAction<LinearSystem>>;
  exploredPresets: string[];
  onMarkPresetExplored: (id: string) => void;
  onSendToSolver: (sys: LinearSystem) => void;
}

function GraphLabModule({
  system,
  setSystem,
  exploredPresets,
  onMarkPresetExplored,
  onSendToSolver
}: GraphLabProps) {
  const [zoomRange, setZoomRange] = useState<number>(10);
  const [showIntercepts, setShowIntercepts] = useState<boolean>(true);
  const [showValueTable, setShowValueTable] = useState<boolean>(false);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const analysis = useMemo(() => analyzeLinearSystem(system), [system]);

  const presets: {
    id: string;
    label: string;
    badge: string;
    sys: LinearSystem;
    color: string;
  }[] = [
    {
      id: 'case1',
      label: 'Case 1: Intersecting Lines',
      badge: 'Unique Solution (3, 1)',
      sys: { a1: 2, b1: 1, c1: 7, a2: 1, b2: -1, c2: 2 },
      color: 'border-emerald-300 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100'
    },
    {
      id: 'case2',
      label: 'Case 2: Parallel Lines',
      badge: 'No Solution (Inconsistent)',
      sys: { a1: 1, b1: 2, c1: 4, a2: 2, b2: 4, c2: 12 },
      color: 'border-rose-300 bg-rose-50/70 text-rose-900 hover:bg-rose-100'
    },
    {
      id: 'case3',
      label: 'Case 3: Coincident Lines',
      badge: 'Infinitely Many Solutions',
      sys: { a1: 2, b1: 3, c1: 6, a2: 4, b2: 6, c2: 12 },
      color: 'border-purple-300 bg-purple-50/70 text-purple-900 hover:bg-purple-100'
    },
    {
      id: 'case4',
      label: 'Orthogonal Axis Lines',
      badge: 'x = 4 & y = -3',
      sys: { a1: 1, b1: 0, c1: 4, a2: 0, b2: 1, c2: -3 },
      color: 'border-blue-300 bg-blue-50/70 text-blue-900 hover:bg-blue-100'
    }
  ];

  // Auto-scale zoom if intersection falls outside current zoomRange
  const handleAutoFit = () => {
    if (analysis.intersection) {
      const maxAbs = Math.max(
        Math.abs(analysis.intersection.x),
        Math.abs(analysis.intersection.y)
      );
      if (maxAbs <= 8) setZoomRange(10);
      else if (maxAbs <= 16) setZoomRange(20);
      else setZoomRange(50);
    } else {
      setZoomRange(10);
    }
  };

  const handleReset = () => {
    setSystem({ a1: 2, b1: 1, c1: 7, a2: 1, b2: -1, c2: 2 });
    setZoomRange(10);
  };

  // SVG Coordinate Plane Geometry (520x520 viewBox)
  const svgSize = 520;
  const pad = 42;
  const innerSize = svgSize - 2 * pad;

  const toSvgX = (x: number) => pad + ((x + zoomRange) / (2 * zoomRange)) * innerSize;
  const toSvgY = (y: number) => pad + ((zoomRange - y) / (2 * zoomRange)) * innerSize;

  const fromSvgX = (px: number) => ((px - pad) / innerSize) * (2 * zoomRange) - zoomRange;
  const fromSvgY = (py: number) => zoomRange - ((py - pad) / innerSize) * (2 * zoomRange);

  const step = zoomRange <= 5 ? 1 : zoomRange <= 10 ? 2 : zoomRange <= 20 ? 4 : 10;
  const gridTicks: number[] = [];
  for (let v = -zoomRange; v <= zoomRange; v += step) {
    gridTicks.push(v);
  }

  const seg1 = computeLineSegment(system.a1, system.b1, system.c1, zoomRange);
  const seg2 = computeLineSegment(system.a2, system.b2, system.c2, zoomRange);

  // Sample points table for Line 1 and Line 2
  const sampleX = [-2, 0, 2];
  const getSamplePoints = (a: number, b: number, c: number) => {
    if (Math.abs(b) > EPSILON) {
      return sampleX.map((x) => ({ x, y: (c - a * x) / b }));
    }
    if (Math.abs(a) > EPSILON) {
      const fixedX = c / a;
      return [-2, 0, 2].map((y) => ({ x: fixedX, y }));
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header & Preset Demonstration Switcher */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Compass className="w-4 h-4" />
              <span>Module C • Interactive Cartesian Coordinate Graph Laboratory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Explore Linear Equations &amp; Intersection Geometry in Real Time
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => onSendToSolver(system)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Solve This Pair Step-by-Step →</span>
            </button>
          </div>
        </div>

        {/* 3 Required Graphical Cases + Orthogonal Preset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presets.map((p) => {
            const explored = exploredPresets.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSystem(p.sys);
                  onMarkPresetExplored(p.id);
                }}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${p.color}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold">{p.label}</span>
                  {explored && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </div>
                <div className="text-[11px] font-medium opacity-85 mt-1">{p.badge}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Laboratory Grid: Controls Left (5 cols) | Cartesian Graph Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Equation Sliders, Inputs & Ratio Analysis */}
        <div className="lg:col-span-5 space-y-5">
          {/* Equation 1 Controller Card */}
          <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Line 1 (a₁x + b₁y = c₁)
                </h2>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                {formatLinearEquation(system.a1, system.b1, system.c1)}
              </span>
            </div>

            <div className="space-y-3">
              {(
                [
                  { key: 'a1', label: 'a₁ (coeff of x)', val: system.a1 },
                  { key: 'b1', label: 'b₁ (coeff of y)', val: system.b1 },
                  { key: 'c1', label: 'c₁ (constant)', val: system.c1 }
                ] as const
              ).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor={`input-${item.key}`} className="font-semibold text-slate-700">
                      {item.label}
                    </label>
                    <input
                      id={`input-${item.key}`}
                      type="number"
                      step="0.5"
                      min={-50}
                      max={50}
                      value={item.val}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setSystem((prev) => ({
                          ...prev,
                          [item.key]: Number.isNaN(v) ? 0 : v
                        }));
                      }}
                      className="w-20 px-2 py-1 text-right font-mono font-bold text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step="0.5"
                    value={Math.max(-12, Math.min(12, item.val))}
                    onChange={(e) =>
                      setSystem((prev) => ({
                        ...prev,
                        [item.key]: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Slope m₁: <strong>{analysis.slope1}</strong></span>
              <span>X-int: <strong>{analysis.xInt1}</strong></span>
              <span>Y-int: <strong>{analysis.yInt1}</strong></span>
            </div>
          </div>

          {/* Equation 2 Controller Card */}
          <div className="bg-white rounded-2xl p-5 border-2 border-purple-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 inline-block" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Line 2 (a₂x + b₂y = c₂)
                </h2>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                {formatLinearEquation(system.a2, system.b2, system.c2)}
              </span>
            </div>

            <div className="space-y-3">
              {(
                [
                  { key: 'a2', label: 'a₂ (coeff of x)', val: system.a2 },
                  { key: 'b2', label: 'b₂ (coeff of y)', val: system.b2 },
                  { key: 'c2', label: 'c₂ (constant)', val: system.c2 }
                ] as const
              ).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor={`input-${item.key}`} className="font-semibold text-slate-700">
                      {item.label}
                    </label>
                    <input
                      id={`input-${item.key}`}
                      type="number"
                      step="0.5"
                      min={-50}
                      max={50}
                      value={item.val}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setSystem((prev) => ({
                          ...prev,
                          [item.key]: Number.isNaN(v) ? 0 : v
                        }));
                      }}
                      className="w-20 px-2 py-1 text-right font-mono font-bold text-xs rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step="0.5"
                    value={Math.max(-12, Math.min(12, item.val))}
                    onChange={(e) =>
                      setSystem((prev) => ({
                        ...prev,
                        [item.key]: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Slope m₂: <strong>{analysis.slope2}</strong></span>
              <span>X-int: <strong>{analysis.xInt2}</strong></span>
              <span>Y-int: <strong>{analysis.yInt2}</strong></span>
            </div>
          </div>

          {/* Toggleable Coordinate Table */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setShowValueTable(!showValueTable)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>NCERT Plotting Table of Solutions (x, y)</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showValueTable ? 'rotate-180' : ''}`}
              />
            </button>

            {showValueTable && (
              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="font-bold text-blue-700 mb-1">Line 1 Sample Points:</div>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    {getSamplePoints(system.a1, system.b1, system.c1).map((pt, idx) => (
                      <div key={idx} className="bg-blue-50/70 p-2 rounded-lg text-center border border-blue-200">
                        ({formatNumber(pt.x, 1)}, {formatNumber(pt.y, 1)})
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-purple-700 mb-1">Line 2 Sample Points:</div>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    {getSamplePoints(system.a2, system.b2, system.c2).map((pt, idx) => (
                      <div key={idx} className="bg-purple-50/70 p-2 rounded-lg text-center border border-purple-200">
                        ({formatNumber(pt.x, 1)}, {formatNumber(pt.y, 1)})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive SVG Graph + Pedagogical Explanation Panel */}
        <div className="lg:col-span-7 space-y-5">
          {/* Graph Canvas Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            {/* Graph Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    analysis.type === 'unique'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : analysis.type === 'none'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : analysis.type === 'infinite'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <span>{analysis.geometry}</span>
                  <span>•</span>
                  <span>{analysis.consistency}</span>
                </span>
              </div>

              {/* Zoom & Intercept Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowIntercepts(!showIntercepts)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                    showIntercepts
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Intercepts
                </button>
                <button
                  type="button"
                  onClick={() => setZoomRange((z) => Math.max(5, Math.round(z / 2)))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-600 px-1">
                  ±{zoomRange}
                </span>
                <button
                  type="button"
                  onClick={() => setZoomRange((z) => Math.min(50, z * 2))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleAutoFit}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Auto-Fit Intersection"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Coordinate Plane */}
            <div className="relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex justify-center">
              <svg
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className="w-full max-w-[520px] h-auto select-none cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = svgSize / rect.width;
                  const scaleY = svgSize / rect.height;
                  const px = (e.clientX - rect.left) * scaleX;
                  const py = (e.clientY - rect.top) * scaleY;
                  if (px >= pad && px <= svgSize - pad && py >= pad && py <= svgSize - pad) {
                    setHoverCoord({
                      x: Number(fromSvgX(px).toFixed(1)),
                      y: Number(fromSvgY(py).toFixed(1))
                    });
                  } else {
                    setHoverCoord(null);
                  }
                }}
                onMouseLeave={() => setHoverCoord(null)}
              >
                <defs>
                  <clipPath id="lab-cartesian-clip">
                    <rect x={pad} y={pad} width={innerSize} height={innerSize} />
                  </clipPath>
                </defs>

                {/* White plot background */}
                <rect x={pad} y={pad} width={innerSize} height={innerSize} fill="#ffffff" />

                {/* Grid Lines & Tick Labels */}
                {gridTicks.map((t) => {
                  const sx = toSvgX(t);
                  const sy = toSvgY(t);
                  const isOrigin = t === 0;
                  return (
                    <g key={t}>
                      <line
                        x1={sx}
                        y1={pad}
                        x2={sx}
                        y2={svgSize - pad}
                        stroke={isOrigin ? '#0f172a' : '#e2e8f0'}
                        strokeWidth={isOrigin ? 2 : 1}
                      />
                      <line
                        x1={pad}
                        y1={sy}
                        x2={svgSize - pad}
                        y2={sy}
                        stroke={isOrigin ? '#0f172a' : '#e2e8f0'}
                        strokeWidth={isOrigin ? 2 : 1}
                      />
                      {!isOrigin && (
                        <>
                          <text
                            x={sx}
                            y={toSvgY(0) + 15}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="600"
                            fill="#475569"
                          >
                            {t}
                          </text>
                          <text
                            x={toSvgX(0) - 7}
                            y={sy + 4}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="600"
                            fill="#475569"
                          >
                            {t}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Axis Titles */}
                <text x={svgSize - pad + 10} y={toSvgY(0) + 4} fontSize="12" fontWeight="bold" fill="#0f172a">
                  X
                </text>
                <text x={ pad - 18 } y={toSvgY(0) + 4} fontSize="11" fontWeight="bold" fill="#64748b">
                  X&apos;
                </text>
                <text x={toSvgX(0)} y={pad - 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a">
                  Y
                </text>
                <text x={toSvgX(0)} y={svgSize - pad + 18} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#64748b">
                  Y&apos;
                </text>
                <text x={toSvgX(0) - 8} y={toSvgY(0) + 14} fontSize="10" fontWeight="bold" fill="#475569">
                  O
                </text>

                {/* Clipped Lines, Intercepts & Intersection Point */}
                <g clipPath="url(#lab-cartesian-clip)">
                  {/* Coincident Highlight Glow if infinite solutions */}
                  {analysis.type === 'infinite' && seg1 && (
                    <line
                      x1={toSvgX(seg1[0].x)}
                      y1={toSvgY(seg1[0].y)}
                      x2={toSvgX(seg1[1].x)}
                      y2={toSvgY(seg1[1].y)}
                      stroke="#c084fc"
                      strokeWidth="10"
                      strokeOpacity="0.35"
                    />
                  )}

                  {/* Line 1 (Blue) */}
                  {seg1 && (
                    <line
                      x1={toSvgX(seg1[0].x)}
                      y1={toSvgY(seg1[0].y)}
                      x2={toSvgX(seg1[1].x)}
                      y2={toSvgY(seg1[1].y)}
                      stroke="#2563eb"
                      strokeWidth="3.2"
                    />
                  )}

                  {/* Line 2 (Purple) */}
                  {seg2 && (
                    <line
                      x1={toSvgX(seg2[0].x)}
                      y1={toSvgY(seg2[0].y)}
                      x2={toSvgX(seg2[1].x)}
                      y2={toSvgY(seg2[1].y)}
                      stroke="#9333ea"
                      strokeWidth="3.2"
                      strokeDasharray={analysis.type === 'infinite' ? '8,6' : undefined}
                    />
                  )}

                  {/* Axis Intercept Dots */}
                  {showIntercepts && (
                    <>
                      {Math.abs(system.a1) > EPSILON && (
                        <circle
                          cx={toSvgX(system.c1 / system.a1)}
                          cy={toSvgY(0)}
                          r="4"
                          fill="#2563eb"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                      {Math.abs(system.b1) > EPSILON && (
                        <circle
                          cx={toSvgX(0)}
                          cy={toSvgY(system.c1 / system.b1)}
                          r="4"
                          fill="#2563eb"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                      {Math.abs(system.a2) > EPSILON && (
                        <circle
                          cx={toSvgX(system.c2 / system.a2)}
                          cy={toSvgY(0)}
                          r="4"
                          fill="#9333ea"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                      {Math.abs(system.b2) > EPSILON && (
                        <circle
                          cx={toSvgX(0)}
                          cy={toSvgY(system.c2 / system.b2)}
                          r="4"
                          fill="#9333ea"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                    </>
                  )}

                  {/* Unique Intersection Marker & Coordinate Callout */}
                  {analysis.intersection && (
                    <g>
                      {/* Dashed projection lines to X and Y axes */}
                      <line
                        x1={toSvgX(analysis.intersection.x)}
                        y1={toSvgY(analysis.intersection.y)}
                        x2={toSvgX(analysis.intersection.x)}
                        y2={toSvgY(0)}
                        stroke="#059669"
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                      />
                      <line
                        x1={toSvgX(analysis.intersection.x)}
                        y1={toSvgY(analysis.intersection.y)}
                        x2={toSvgX(0)}
                        y2={toSvgY(analysis.intersection.y)}
                        stroke="#059669"
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                      />
                      <circle
                        cx={toSvgX(analysis.intersection.x)}
                        cy={toSvgY(analysis.intersection.y)}
                        r="11"
                        fill="#10b981"
                        fillOpacity="0.22"
                      />
                      <circle
                        cx={toSvgX(analysis.intersection.x)}
                        cy={toSvgY(analysis.intersection.y)}
                        r="6"
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <rect
                        x={Math.min(svgSize - 145, Math.max(pad + 6, toSvgX(analysis.intersection.x) + 10))}
                        y={Math.max(pad + 8, toSvgY(analysis.intersection.y) - 28)}
                        width="124"
                        height="22"
                        rx="6"
                        fill="#064e3b"
                      />
                      <text
                        x={Math.min(svgSize - 145, Math.max(pad + 6, toSvgX(analysis.intersection.x) + 10)) + 62}
                        y={Math.max(pad + 8, toSvgY(analysis.intersection.y) - 28) + 15}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        P({formatNumber(analysis.intersection.x)}, {formatNumber(analysis.intersection.y)})
                      </text>
                    </g>
                  )}
                </g>
              </svg>

              {/* Floating Cursor Coordinates Badge */}
              {hoverCoord && (
                <div className="absolute top-3 left-3 bg-slate-900/85 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg pointer-events-none">
                  Cursor: ({hoverCoord.x}, {hoverCoord.y})
                </div>
              )}
            </div>

            {/* Graph Legend & Intersection Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-blue-700">
                  <span className="w-3 h-1 bg-blue-600 inline-block rounded" />
                  L₁: {formatLinearEquation(system.a1, system.b1, system.c1)}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-purple-700">
                  <span className="w-3 h-1 bg-purple-600 inline-block rounded" />
                  L₂: {formatLinearEquation(system.a2, system.b2, system.c2)}
                </span>
              </div>
              <div className="font-mono font-bold text-slate-800">
                {analysis.intersection
                  ? `Intersection: (${formatNumber(analysis.intersection.x)}, ${formatNumber(analysis.intersection.y)})`
                  : analysis.type === 'none'
                  ? 'Intersection: None (Parallel)'
                  : analysis.type === 'infinite'
                  ? 'Intersection: All points on line (∞)'
                  : 'Invalid Line'}
              </div>
            </div>
          </div>

          {/* Explanation Panel: WHY This Pair Has That Solution */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Why Does This Pair Have {analysis.geometry}?</span>
              </h3>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300">
                {analysis.ratioRelation}
              </span>
            </div>

            {/* Live Ratio Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Ratio a₁ / a₂</div>
                <div className="font-mono text-sm font-extrabold text-slate-900 mt-1">
                  {system.a1} / {system.a2} = {analysis.ratioA}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Ratio b₁ / b₂</div>
                <div className="font-mono text-sm font-extrabold text-slate-900 mt-1">
                  {system.b1} / {system.b2} = {analysis.ratioB}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Ratio c₁ / c₂</div>
                <div className="font-mono text-sm font-extrabold text-slate-900 mt-1">
                  {system.c1} / {system.c2} = {analysis.ratioC}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
              <strong className="text-blue-950">Mathematical Reasoning: </strong>
              {analysis.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE D: STEP-BY-STEP ALGEBRAIC SOLVER
// ============================================================================

interface SolverProps {
  system: LinearSystem;
  setSystem: React.Dispatch<React.SetStateAction<LinearSystem>>;
  methodsUsed: string[];
  onMarkMethodUsed: (method: string) => void;
  onOpenInLab: (sys: LinearSystem) => void;
}

function StepByStepSolverModule({
  system,
  setSystem,
  methodsUsed,
  onMarkMethodUsed,
  onOpenInLab
}: SolverProps) {
  const [method, setMethod] = useState<'substitution' | 'elimination' | 'cross'>('substitution');
  const [stepMode, setStepMode] = useState<'all' | 'guided'>('all');
  const [visibleSteps, setVisibleSteps] = useState<number>(6);

  const analysis = useMemo(() => analyzeLinearSystem(system), [system]);

  const handleSelectMethod = (m: 'substitution' | 'elimination' | 'cross') => {
    setMethod(m);
    onMarkMethodUsed(m);
    if (stepMode === 'guided') setVisibleSteps(1);
  };

  // Build dynamic step-by-step derivation for the selected algebraic method
  const derivationSteps = useMemo(() => {
    const { a1, b1, c1, a2, b2, c2 } = system;
    const eq1Str = formatLinearEquation(a1, b1, c1);
    const eq2Str = formatLinearEquation(a2, b2, c2);

    if (analysis.type === 'degenerate') {
      return [
        {
          title: 'Validate Linear System Coefficients',
          math: `Eq (1): ${eq1Str}   |   Eq (2): ${eq2Str}`,
          reason:
            'At least one equation has both x and y coefficients equal to 0. Please enter non-zero coefficients for x or y.'
        }
      ];
    }

    if (method === 'substitution') {
      const steps: { title: string; math: string; reason: string }[] = [
        {
          title: 'Write both linear equations in standard form',
          math: `Equation (1): ${eq1Str}   |   Equation (2): ${eq2Str}`,
          reason: 'Label both equations clearly so we can isolate one variable from Equation (1) and substitute into Equation (2).'
        }
      ];

      if (Math.abs(b1) > EPSILON) {
        steps.push({
          title: 'Express y in terms of x from Equation (1)',
          math: `${formatNumber(b1)}y = ${formatNumber(c1)} - (${formatNumber(a1)})x   ⇒   y = (${formatNumber(c1)} - ${formatNumber(a1)}x) / ${formatNumber(b1)}`,
          reason: `Since b₁ = ${formatNumber(b1)} ≠ 0, we isolate y on the left-hand side of Equation (1).`
        });
        steps.push({
          title: 'Substitute this expression for y into Equation (2)',
          math: `${formatNumber(a2)}x + ${formatNumber(b2)} · [ (${formatNumber(c1)} - ${formatNumber(a1)}x) / ${formatNumber(b1)} ] = ${formatNumber(c2)}`,
          reason: 'Replacing y in Equation (2) eliminates y and creates a single linear equation in one variable (x).'
        });
      } else {
        const xVal = c1 / a1;
        steps.push({
          title: 'Solve directly for x from Equation (1)',
          math: `${formatNumber(a1)}x = ${formatNumber(c1)}   ⇒   x = ${formatNumber(xVal)}`,
          reason: 'Because b₁ = 0, Equation (1) already contains only x.'
        });
      }

      if (analysis.type === 'unique' && analysis.intersection) {
        const { x, y } = analysis.intersection;
        steps.push({
          title: 'Clear the denominator and solve for x',
          math: `(${formatNumber(analysis.det)})x = ${formatNumber(analysis.dx)}   ⇒   x = ${formatNumber(analysis.dx)} / ${formatNumber(analysis.det)} = ${formatNumber(x)}`,
          reason: 'Multiplying through by b₁ and collecting like terms of x isolates the exact value of x.'
        });
        steps.push({
          title: 'Back-substitute the value of x to find y',
          math: `Substitute x = ${formatNumber(x)} into Equation (1): (${formatNumber(a1)})(${formatNumber(x)}) + (${formatNumber(b1)})y = ${formatNumber(c1)}   ⇒   y = ${formatNumber(y)}`,
          reason: 'Substituting the known value of x back into Equation (1) yields the corresponding value of y.'
        });
      } else if (analysis.type === 'none') {
        steps.push({
          title: 'Simplify and observe the algebraic contradiction',
          math: `0 · x = ${formatNumber(analysis.dx)} ≠ 0   (Contradiction!)`,
          reason: 'The variable x cancels out completely leaving a false statement. Therefore, the system is inconsistent and has NO solution.'
        });
      } else if (analysis.type === 'infinite') {
        steps.push({
          title: 'Simplify and observe the universal identity',
          math: `0 · x = 0   (Always True Identity!)`,
          reason: 'The variable cancels out leaving 0 = 0, which holds for every real x. Hence, the system has INFINITELY MANY solutions along the line.'
        });
      }
      return steps;
    }

    if (method === 'elimination') {
      const steps: { title: string; math: string; reason: string }[] = [
        {
          title: 'Inspect the coefficients of x and y in both equations',
          math: `Eq (1): ${eq1Str}   |   Eq (2): ${eq2Str}`,
          reason: 'To eliminate y (or x), we multiply the equations by suitable constants so that one variable has equal-magnitude coefficients.'
        },
        {
          title: 'Multiply Equation (1) by b₂ and Equation (2) by b₁ to align y-coefficients',
          math: `Eq (1) × (${formatNumber(b2)}): ${formatNumber(a1 * b2)}x + ${formatNumber(b1 * b2)}y = ${formatNumber(c1 * b2)}  |  Eq (2) × (${formatNumber(b1)}): ${formatNumber(a2 * b1)}x + ${formatNumber(b2 * b1)}y = ${formatNumber(c2 * b1)}`,
          reason: `Now both equations have the exact same y-term (${formatNumber(b1 * b2)}y).`
        },
        {
          title: 'Subtract the second new equation from the first to eliminate y',
          math: `(${formatNumber(a1 * b2)} - ${formatNumber(a2 * b1)})x = ${formatNumber(c1 * b2)} - ${formatNumber(c2 * b1)}   ⇒   (${formatNumber(analysis.det)})x = ${formatNumber(analysis.dx)}`,
          reason: 'Subtracting cancels the y-terms completely, leaving a simple equation in x.'
        }
      ];

      if (analysis.type === 'unique' && analysis.intersection) {
        const { x, y } = analysis.intersection;
        steps.push({
          title: 'Solve for x and substitute back to find y',
          math: `x = ${formatNumber(analysis.dx)} / ${formatNumber(analysis.det)} = ${formatNumber(x)},   and substituting x = ${formatNumber(x)} gives y = ${formatNumber(y)}`,
          reason: 'Dividing by the non-zero coefficient of x gives x, which we plug into Equation (1) to find y.'
        });
      } else if (analysis.type === 'none') {
        steps.push({
          title: 'Interpret the zero-coefficient contradiction',
          math: `0 · x = ${formatNumber(analysis.dx)} ≠ 0   ⇒   No Solution (Inconsistent)`,
          reason: 'Since 0 cannot equal a non-zero number, no pair (x, y) can satisfy both equations.'
        });
      } else {
        steps.push({
          title: 'Interpret the 0 = 0 identity',
          math: `0 · x = 0   ⇒   Infinitely Many Solutions (Coincident Lines)`,
          reason: 'Both variables vanish into 0 = 0 because the two equations are scalar multiples of one another.'
        });
      }
      return steps;
    }

    // Cross-Multiplication Method (NCERT Form: a1x + b1y + c1' = 0 where c1' = -c1)
    const c1p = -c1;
    const c2p = -c2;
    const numX = b1 * c2p - b2 * c1p; // equals c1*b2 - c2*b1 = dx
    const numY = c1p * a2 - c2p * a1; // equals a1*c2 - a2*c1 = dy
    const den = a1 * b2 - a2 * b1; // det

    const steps: { title: string; math: string; reason: string }[] = [
      {
        title: 'Rewrite both equations in NCERT Cross-Multiplication form (RHS = 0)',
        math: `Eq (1): ${formatNumber(a1)}x + (${formatNumber(b1)})y + (${formatNumber(c1p)}) = 0   |   Eq (2): ${formatNumber(a2)}x + (${formatNumber(b2)})y + (${formatNumber(c2p)}) = 0`,
        reason: 'Cross-multiplication requires all terms on the LHS so that c₁′ = -c₁ and c₂′ = -c₂.'
      },
      {
        title: 'Set up the Cross-Multiplication Determinant Proportions',
        math: `x / [ (${formatNumber(b1)})(${formatNumber(c2p)}) - (${formatNumber(b2)})(${formatNumber(c1p)}) ] = y / [ (${formatNumber(c1p)})(${formatNumber(a2)}) - (${formatNumber(c2p)})(${formatNumber(a1)}) ] = 1 / [ (${formatNumber(a1)})(${formatNumber(b2)}) - (${formatNumber(a2)})(${formatNumber(b1)}) ]`,
        reason: 'Using the cyclic cross-product pattern (b₁, c₁′, a₁, b₁) × (b₂, c₂′, a₂, b₂).'
      },
      {
        title: 'Evaluate each cross-product denominator',
        math: `x / (${formatNumber(numX)})  =  y / (${formatNumber(numY)})  =  1 / (${formatNumber(den)})`,
        reason: 'Simplifying the three 2×2 determinants gives the direct ratios for x, y, and 1.'
      }
    ];

    if (analysis.type === 'unique' && analysis.intersection) {
      const { x, y } = analysis.intersection;
      steps.push({
        title: 'Equate the x and y ratios with the constant term ratio',
        math: `x = ${formatNumber(numX)} / ${formatNumber(den)} = ${formatNumber(x)}   and   y = ${formatNumber(numY)} / ${formatNumber(den)} = ${formatNumber(y)}`,
        reason: 'Since a₁b₂ - a₂b₁ ≠ 0, dividing by the common denominator yields the unique solution (x, y).'
      });
    } else if (analysis.type === 'none') {
      steps.push({
        title: 'Denominator is zero while numerators are non-zero',
        math: `a₁b₂ - a₂b₁ = 0, but numerator = ${formatNumber(numX)} ≠ 0   ⇒   No Solution`,
        reason: 'Division by zero with a non-zero numerator indicates parallel inconsistent lines.'
      });
    } else {
      steps.push({
        title: 'All three cross-products equal zero',
        math: `x / 0 = y / 0 = 1 / 0   ⇒   Infinitely Many Solutions (Coincident)`,
        reason: 'Every cross-product is zero because the rows are proportional.'
      });
    }
    return steps;
  }, [system, method, analysis]);

  const solverPresets: { label: string; sys: LinearSystem }[] = [
    { label: 'NCERT Ex 3.3: x + y = 14, x - y = 4', sys: { a1: 1, b1: 1, c1: 14, a2: 1, b2: -1, c2: 4 } },
    { label: 'NCERT Ex 3.4: 3x + 4y = 10, 2x - 2y = 2', sys: { a1: 3, b1: 4, c1: 10, a2: 2, b2: -2, c2: 2 } },
    { label: 'NCERT Ex 3.5: 2x + y = 5, 3x + 2y = 8', sys: { a1: 2, b1: 1, c1: 5, a2: 3, b2: 2, c2: 8 } },
    { label: 'Parallel Case: 2x + 3y = 7, 4x + 6y = 15', sys: { a1: 2, b1: 3, c1: 7, a2: 4, b2: 6, c2: 15 } }
  ];

  // Verification calculation
  const verify1LHS = analysis.intersection
    ? system.a1 * analysis.intersection.x + system.b1 * analysis.intersection.y
    : null;
  const verify2LHS = analysis.intersection
    ? system.a2 * analysis.intersection.x + system.b2 * analysis.intersection.y
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Calculator className="w-4 h-4" />
            <span>Module D • Interactive Step-by-Step Algebraic Solver</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Compare Substitution, Elimination &amp; Cross-Multiplication
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onOpenInLab(system)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>Visualize This Pair in Graph Lab →</span>
        </button>
      </div>

      {/* Equation Entry & Textbook Presets */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Quick NCERT Examples:</span>
          {solverPresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSystem(p.sys)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Eq 1 Inputs */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
            <div className="text-xs font-bold text-blue-900">
              Equation (1): a₁x + b₁y = c₁
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                value={system.a1}
                onChange={(e) => setSystem((s) => ({ ...s, a1: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1.5 rounded-lg border border-blue-300 bg-white font-mono text-sm font-bold text-center"
                aria-label="a1"
              />
              <span className="font-mono font-bold text-sm">x +</span>
              <input
                type="number"
                value={system.b1}
                onChange={(e) => setSystem((s) => ({ ...s, b1: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1.5 rounded-lg border border-blue-300 bg-white font-mono text-sm font-bold text-center"
                aria-label="b1"
              />
              <span className="font-mono font-bold text-sm">y =</span>
              <input
                type="number"
                value={system.c1}
                onChange={(e) => setSystem((s) => ({ ...s, c1: parseFloat(e.target.value) || 0 }))}
                className="w-20 px-2 py-1.5 rounded-lg border border-blue-300 bg-white font-mono text-sm font-bold text-center"
                aria-label="c1"
              />
            </div>
          </div>

          {/* Eq 2 Inputs */}
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
            <div className="text-xs font-bold text-purple-900">
              Equation (2): a₂x + b₂y = c₂
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                value={system.a2}
                onChange={(e) => setSystem((s) => ({ ...s, a2: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1.5 rounded-lg border border-purple-300 bg-white font-mono text-sm font-bold text-center"
                aria-label="a2"
              />
              <span className="font-mono font-bold text-sm">x +</span>
              <input
                type="number"
                value={system.b2}
                onChange={(e) => setSystem((s) => ({ ...s, b2: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1.5 rounded-lg border border-purple-300 bg-white font-mono text-sm font-bold text-center"
                aria-label="b2"
              />
              <span className="font-mono font-bold text-sm">y =</span>
              <input
                type="number"
                value={system.c2}
                onChange={(e) => setSystem((s) => ({ ...s, c2: parseFloat(e.target.value) || 0 }))}
                className="w-20 px-2 py-1.5 rounded-lg border border-purple-300 bg-white font-mono text-sm font-bold text-center"
                aria-label="c2"
              />
            </div>
          </div>
        </div>

        {/* Method Selector Tabs & Guided Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'substitution', label: '1. Substitution Method' },
                { id: 'elimination', label: '2. Elimination Method' },
                { id: 'cross', label: '3. Cross-Multiplication Method' }
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMethod(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  method === m.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{m.label}</span>
                {methodsUsed.includes(m.id) && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStepMode('guided');
                setVisibleSteps(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                stepMode === 'guided'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Guided Reveal
            </button>
            <button
              type="button"
              onClick={() => {
                setStepMode('all');
                setVisibleSteps(10);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                stepMode === 'all'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Show All Steps
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Derivation Cards */}
      <div className="space-y-3">
        {derivationSteps
          .slice(0, stepMode === 'all' ? derivationSteps.length : visibleSteps)
          .map((st, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{st.title}</h3>
              </div>
              <div className="font-mono text-sm font-bold text-blue-950 bg-slate-50 p-3.5 rounded-xl border border-slate-200 overflow-x-auto">
                {st.math}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-indigo-700">Mathematical Reasoning: </strong>
                {st.reason}
              </p>
            </div>
          ))}

        {stepMode === 'guided' && visibleSteps < derivationSteps.length && (
          <button
            type="button"
            onClick={() => setVisibleSteps((v) => v + 1)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-extrabold cursor-pointer"
          >
            Reveal Next Calculation Step ({visibleSteps + 1} of {derivationSteps.length}) →
          </button>
        )}
      </div>

      {/* Final Solution & Substitution Verification Card */}
      {analysis.intersection && verify1LHS !== null && verify2LHS !== null && (
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              <h3 className="text-lg font-extrabold">
                Final Solution &amp; Substitution Verification
              </h3>
            </div>
            <div className="font-mono text-base font-extrabold bg-emerald-800/80 px-4 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-200">
              x = {formatNumber(analysis.intersection.x)},   y = {formatNumber(analysis.intersection.y)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-1">
              <div className="text-emerald-300 font-sans font-bold">
                Check in Equation (1): {formatLinearEquation(system.a1, system.b1, system.c1)}
              </div>
              <div>
                LHS = ({formatNumber(system.a1)})({formatNumber(analysis.intersection.x)}) + (
                {formatNumber(system.b1)})({formatNumber(analysis.intersection.y)})
              </div>
              <div>
                LHS = {formatNumber(verify1LHS)} = RHS ({formatNumber(system.c1)}) ✓ Verified!
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-1">
              <div className="text-emerald-300 font-sans font-bold">
                Check in Equation (2): {formatLinearEquation(system.a2, system.b2, system.c2)}
              </div>
              <div>
                LHS = ({formatNumber(system.a2)})({formatNumber(analysis.intersection.x)}) + (
                {formatNumber(system.b2)})({formatNumber(analysis.intersection.y)})
              </div>
              <div>
                LHS = {formatNumber(verify2LHS)} = RHS ({formatNumber(system.c2)}) ✓ Verified!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODULE E: PRACTICE ZONE (ADAPTIVE SCAFFOLDING & MISTAKE DIAGNOSTICS)
// ============================================================================

interface PracticeZoneProps {
  solvedIds: string[];
  onRecordAttempt: (id: string, isCorrect: boolean) => void;
  onOpenInLab: (sys: LinearSystem) => void;
}

function PracticeZoneModule({ solvedIds, onRecordAttempt, onOpenInLab }: PracticeZoneProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'MCQ' | 'Numerical' | 'Graph' | 'Conceptual'>('All');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(PRACTICE_QUESTIONS[0].id);

  // Per-question interaction states
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ status: 'correct' | 'incorrect'; message: string } | null>(null);

  const filteredQuestions = useMemo(() => {
    return PRACTICE_QUESTIONS.filter((q) => {
      if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) return false;
      if (typeFilter !== 'All' && q.type !== typeFilter) return false;
      return true;
    });
  }, [difficultyFilter, typeFilter]);

  const currentQuestion =
    filteredQuestions.find((q) => q.id === selectedQuestionId) ||
    filteredQuestions[0] ||
    PRACTICE_QUESTIONS[0];

  useEffect(() => {
    setUserAnswer('');
    setShowHint(false);
    setShowSolution(false);
    setFeedback(null);
  }, [currentQuestion.id]);

  const handleSubmitAnswer = () => {
    const trimmed = userAnswer.trim();
    if (!trimmed) return;

    let isCorrect = false;
    if (currentQuestion.type === 'Numerical') {
      const numUser = parseFloat(trimmed);
      const numExpected = parseFloat(currentQuestion.correctAnswer);
      const tol = currentQuestion.numericTolerance ?? 0.01;
      isCorrect = !Number.isNaN(numUser) && Math.abs(numUser - numExpected) <= tol;
    } else {
      isCorrect = trimmed === currentQuestion.correctAnswer;
    }

    onRecordAttempt(currentQuestion.id, isCorrect);

    if (isCorrect) {
      setFeedback({
        status: 'correct',
        message: 'Spot on! Your mathematical reasoning is accurate. Review the step-by-step confirmation below.'
      });
      setShowSolution(true);
    } else {
      const specificDiag =
        currentQuestion.misconceptionDiagnosis[trimmed] || currentQuestion.defaultDiagnosis;
      setFeedback({
        status: 'incorrect',
        message: specificDiag
      });
      setShowHint(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Target className="w-4 h-4" />
              <span>Module E • Guided Practice Zone with Mistake Diagnostics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Scaffolded NCERT Problem Solving
            </h1>
          </div>
          <div className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200">
            Solved: {solvedIds.length} / {PRACTICE_QUESTIONS.length} Questions
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Difficulty Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Difficulty:</span>
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficultyFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  difficultyFilter === d
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Question Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Format:</span>
            {(['All', 'MCQ', 'Numerical', 'Graph', 'Conceptual'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question List Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1.5">
            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Question ({filteredQuestions.length})
            </div>
            {filteredQuestions.map((q, idx) => {
              const active = q.id === currentQuestion.id;
              const solved = solvedIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          active
                            ? 'bg-white/20 text-white'
                            : q.difficulty === 'Beginner'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.difficulty === 'Intermediate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.type}
                      </span>
                    </div>
                    <div className="text-xs font-bold line-clamp-2">
                      Q{idx + 1}: {q.prompt}
                    </div>
                  </div>
                  {solved && (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-1 ${
                        active ? 'text-emerald-300' : 'text-emerald-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Question Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700">
                {currentQuestion.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700">
                {currentQuestion.type} Question
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • {currentQuestion.topic}
              </span>
            </div>
            {currentQuestion.equationPair && (
              <button
                type="button"
                onClick={() =>
                  currentQuestion.equationPair && onOpenInLab(currentQuestion.equationPair)
                }
                className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Inspect in Graph Lab</span>
              </button>
            )}
          </div>

          {/* Question Prompt */}
          <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQuestion.prompt}
          </div>

          {/* Embedded Graph if Graph Question */}
          {currentQuestion.type === 'Graph' && currentQuestion.equationPair && (
            <div className="max-w-sm mx-auto">
              <MiniCartesianPlot system={currentQuestion.equationPair} height={240} />
            </div>
          )}

          {/* Answer Input Area */}
          {currentQuestion.options ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => {
                const selected = userAnswer === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setUserAnswer(opt)}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      selected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="numeric-practice-input" className="block text-xs font-bold text-slate-700">
                Enter Your Numerical Answer:
              </label>
              <input
                id="numeric-practice-input"
                type="number"
                step="any"
                placeholder="e.g., 8"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          {/* Action Buttons: Submit, Hint, Full Solution */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmitAnswer}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Check Answer
            </button>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSolution(!showSolution)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{showSolution ? 'Hide Solution Steps' : 'Show Step-by-Step Solution'}</span>
            </button>
          </div>

          {/* Diagnostic Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm space-y-1 ${
                feedback.status === 'correct'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="font-extrabold flex items-center gap-2">
                {feedback.status === 'correct' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Excellent Work! (+15 XP)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Diagnostic Hint — Let&apos;s Spot the Mistake:</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">{feedback.message}</p>
            </div>
          )}

          {/* Scaffolding Hint Box */}
          {showHint && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950">
              <strong className="font-bold">Scaffolding Hint: </strong>
              {currentQuestion.hint}
            </div>
          )}

          {/* Step-by-Step Solution Box */}
          {showSolution && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs sm:text-sm">
              <div className="font-bold text-blue-300 uppercase tracking-wider text-xs">
                Complete Step-by-Step NCERT Solution
              </div>
              {currentQuestion.stepByStepSolution.map((step, i) => (
                <div key={i} className="bg-white/10 p-2.5 rounded-lg font-mono text-xs">
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE F: GAMIFIED CHALLENGE ARENA
// ============================================================================

interface ArenaProps {
  progress: StudentProgress;
  onAnswerArena: (points: number, isCorrect: boolean) => void;
  onCompleteDailyChallenge: () => void;
}

function ChallengeArenaModule({
  progress,
  onAnswerArena,
  onCompleteDailyChallenge
}: ArenaProps) {
  const [selectedTier, setSelectedTier] = useState<'All' | 'Cadet' | 'Scholar' | 'Olympiad'>('All');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState<number>(0);

  // Daily Challenge State
  const [dailyFareBase, setDailyFareBase] = useState<string>('');
  const [dailyFarePerKm, setDailyFarePerKm] = useState<string>('');
  const [dailyFeedback, setDailyFeedback] = useState<string | null>(null);

  const pool = useMemo(() => {
    return selectedTier === 'All'
      ? ARENA_ITEMS
      : ARENA_ITEMS.filter((i) => i.tier === selectedTier);
  }, [selectedTier]);

  const currentItem = pool[currentIdx % pool.length] || ARENA_ITEMS[0];

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const isCorrect = idx === currentItem.correctIndex;
    if (isCorrect) {
      setSessionScore((s) => s + currentItem.points);
    }
    onAnswerArena(currentItem.points, isCorrect);
  };

  const handleNextChallenge = () => {
    setSelectedOption(null);
    setCurrentIdx((i) => (i + 1) % pool.length);
  };

  const handleCheckDailyChallenge = () => {
    const x = parseFloat(dailyFareBase);
    const y = parseFloat(dailyFarePerKm);
    if (Math.abs(x - 5) < 0.01 && Math.abs(y - 10) < 0.01) {
      setDailyFeedback('Correct! Fixed charge x = ₹5 and charge per km y = ₹10. For 25 km, fare = 5 + 25(10) = ₹255!');
      onCompleteDailyChallenge();
    } else {
      setDailyFeedback(
        'Not quite! Hint: Subtract Equation 1 (x + 10y = 105) from Equation 2 (x + 15y = 155) to get 5y = 50 ⇒ y = 10, then find x!'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Arena Scoreboard Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Trophy className="w-4 h-4" />
              <span>Module F • Gamified Challenge Arena</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1">
              Build Your Streak, Earn XP &amp; Unlock Badges
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/15 text-center">
              <div className="text-[11px] text-slate-300">Total XP</div>
              <div className="text-lg font-extrabold text-amber-300">{progress.arenaPoints}</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/15 text-center">
              <div className="text-[11px] text-slate-300">Current Streak</div>
              <div className="text-lg font-extrabold text-orange-400">{progress.arenaStreak} 🔥</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/15 text-center">
              <div className="text-[11px] text-slate-300">Best Streak</div>
              <div className="text-lg font-extrabold text-emerald-300">{progress.arenaBestStreak}</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/15 text-center">
              <div className="text-[11px] text-slate-300">Session Score</div>
              <div className="text-lg font-extrabold text-blue-300">+{sessionScore} XP</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Rapid Challenge Deck + Daily Challenge */}
        <div className="lg:col-span-7 space-y-6">
          {/* Rapid Challenge Deck */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                {(['All', 'Cadet', 'Scholar', 'Olympiad'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tier);
                      setCurrentIdx(0);
                      setSelectedOption(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      selectedTier === tier
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
              <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                +{currentItem.points} XP Reward
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase">
                Arena Challenge #{(currentIdx % pool.length) + 1} of {pool.length} ({currentItem.tier} Tier)
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {currentItem.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentItem.options.map((opt, idx) => {
                const isPicked = selectedOption === idx;
                const isRight = idx === currentItem.correctIndex;
                let style = 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-400';
                if (selectedOption !== null) {
                  if (isRight) style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                  else if (isPicked) style = 'bg-rose-50 border-rose-400 text-rose-900';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isRight && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="space-y-3 pt-2">
                <div
                  className={`p-3.5 rounded-xl text-xs sm:text-sm border ${
                    selectedOption === currentItem.correctIndex
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <strong>
                    {selectedOption === currentItem.correctIndex
                      ? `Correct! +${currentItem.points} XP! `
                      : 'Streak Reset — Explanation: '}
                  </strong>
                  {currentItem.feedback}
                </div>
                <button
                  type="button"
                  onClick={handleNextChallenge}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Next Arena Challenge →
                </button>
              </div>
            )}
          </div>

          {/* Daily Word-Problem Challenge */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-800">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Daily NCERT Word Problem Challenge (+50 Bonus XP)</span>
              </div>
              {progress.dailyChallengeCompleted && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  Completed ✓
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              <strong>The City Taxi Problem (NCERT Ex 3.3 Q3):</strong> The taxi charges in a city consist of a fixed charge (<strong className="font-mono">₹x</strong>) together with the charge for the distance covered (<strong className="font-mono">₹y per km</strong>). For a distance of <strong>10 km</strong>, the charge paid is <strong>₹105</strong> (<span className="font-mono">x + 10y = 105</span>), and for a journey of <strong>15 km</strong>, the charge paid is <strong>₹155</strong> (<span className="font-mono">x + 15y = 155</span>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="daily-x" className="block text-xs font-bold text-slate-700 mb-1">
                  Fixed Charge x (in ₹):
                </label>
                <input
                  id="daily-x"
                  type="number"
                  placeholder="Enter x"
                  value={dailyFareBase}
                  onChange={(e) => setDailyFareBase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-mono text-sm font-bold"
                />
              </div>
              <div>
                <label htmlFor="daily-y" className="block text-xs font-bold text-slate-700 mb-1">
                  Per-Kilometer Charge y (in ₹/km):
                </label>
                <input
                  id="daily-y"
                  type="number"
                  placeholder="Enter y"
                  value={dailyFarePerKm}
                  onChange={(e) => setDailyFarePerKm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-mono text-sm font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckDailyChallenge}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Verify Daily Challenge Solution
            </button>

            {dailyFeedback && (
              <div className="p-3 rounded-xl bg-white border border-amber-300 text-xs text-slate-800 font-medium">
                {dailyFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Achievement Badges Showcase */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Achievement Badges</span>
            </h2>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              {progress.unlockedBadges.length} / {BADGE_DEFINITIONS.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {BADGE_DEFINITIONS.map((b) => {
              const unlocked = progress.unlockedBadges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    unlocked
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unlocked
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-slate-900">{b.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          unlocked
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {unlocked ? 'Unlocked ✓' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE G: ASSESSMENT & PERFORMANCE DASHBOARD (10-QUESTION EXAM + RECHARTS)
// ============================================================================

interface AssessmentProps {
  attempts: AssessmentAttempt[];
  onSaveAssessment: (attempt: AssessmentAttempt) => void;
  onNavigateToTopic: (topic: string) => void;
  onOpenLab: () => void;
}

function AssessmentModule({
  attempts,
  onSaveAssessment,
  onNavigateToTopic,
  onOpenLab
}: AssessmentProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const answeredCount = Object.keys(selectedAnswers).length;

  // Evaluate current submission or latest saved attempt
  const currentEvaluation = useMemo(() => {
    let score = 0;
    const topicScores: Record<string, { correct: number; total: number }> = {};

    for (const q of ASSESSMENT_QUESTIONS) {
      if (!topicScores[q.topic]) {
        topicScores[q.topic] = { correct: 0, total: 0 };
      }
      topicScores[q.topic].total += 1;
      if (selectedAnswers[q.id] === q.correctIndex) {
        score += 1;
        topicScores[q.topic].correct += 1;
      }
    }

    const total = ASSESSMENT_QUESTIONS.length;
    const percentage = Math.round((score / total) * 100);
    return { score, total, percentage, topicScores };
  }, [selectedAnswers]);

  const handleSubmitExam = () => {
    setSubmitted(true);
    const attempt: AssessmentAttempt = {
      id: `att-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: currentEvaluation.score,
      total: currentEvaluation.total,
      percentage: currentEvaluation.percentage,
      topicScores: currentEvaluation.topicScores
    };
    onSaveAssessment(attempt);
  };

  const handleRetakeExam = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  // Topic chart data (either from active submission or latest saved attempt)
  const activeTopicScores = submitted
    ? currentEvaluation.topicScores
    : attempts[0]?.topicScores || null;

  const topicChartData = useMemo(() => {
    if (!activeTopicScores) return [];
    return Object.entries(activeTopicScores).map(([topic, stat]) => ({
      topic: topic.length > 22 ? topic.slice(0, 20) + '…' : topic,
      fullTopic: topic,
      accuracy: Math.round((stat.correct / stat.total) * 100),
      correct: stat.correct,
      total: stat.total
    }));
  }, [activeTopicScores]);

  const weakTopics = useMemo(() => {
    return topicChartData.filter((d) => d.accuracy < 100);
  }, [topicChartData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600">
            <BarChart3 className="w-4 h-4" />
            <span>Module G • Chapter Assessment &amp; Performance Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            10-Question NCERT Mastery Evaluation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200">
            Answered: {answeredCount} / {ASSESSMENT_QUESTIONS.length}
          </span>
          {submitted && (
            <button
              type="button"
              onClick={handleRetakeExam}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
          )}
        </div>
      </div>

      {/* Performance Analytics Dashboard (Shown after submit or if previous attempts exist) */}
      {(submitted || attempts.length > 0) && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Performance Report &amp; Topic-Wise Diagnostics
              </h2>
              <p className="text-xs text-slate-500">
                {submitted
                  ? 'Showing results from your current submission'
                  : `Showing results from your latest attempt (${attempts[0].date})`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-[10px] font-bold uppercase text-emerald-700">Total Marks</div>
                <div className="text-lg font-extrabold text-emerald-900">
                  {submitted ? currentEvaluation.score : attempts[0].score} / 10
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <div className="text-[10px] font-bold uppercase text-blue-700">Percentage</div>
                <div className="text-lg font-extrabold text-blue-900">
                  {submitted ? currentEvaluation.percentage : attempts[0].percentage}%
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-[10px] font-bold uppercase text-rose-700">Incorrect</div>
                <div className="text-lg font-extrabold text-rose-900">
                  {10 - (submitted ? currentEvaluation.score : attempts[0].score)}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Topic-Wise Accuracy Chart + Revision Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Topic-Wise Accuracy Breakdown (%)
              </div>
              <div className="relative h-72 w-full bg-slate-50 rounded-xl p-3 border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicChartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="topic" width={145} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value}% Accuracy`, 'Performance']}
                    />
                    <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                      {topicChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.accuracy >= 80
                              ? '#10b981'
                              : entry.accuracy >= 50
                              ? '#f59e0b'
                              : '#ef4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Personalized Revision Suggestions */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Personalized Revision Recommendations</span>
              </div>

              {weakTopics.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
                  <div className="font-extrabold text-emerald-800">
                    100% Mastery Across All 5 Sub-Topics!
                  </div>
                  <p>
                    You answered every topic accurately. Keep experimenting in the Graph Laboratory or challenge yourself in the Olympiad tier of the Arena!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {weakTopics.map((wt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">
                          {wt.fullTopic}
                        </span>
                        <span className="text-xs font-bold text-amber-800">
                          {wt.correct}/{wt.total} ({wt.accuracy}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigateToTopic(wt.fullTopic)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Revise Concept in Learn →
                        </button>
                        <button
                          type="button"
                          onClick={onOpenLab}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold cursor-pointer"
                        >
                          Test in Graph Lab
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10 Assessment Questions List */}
      <div className="space-y-4">
        {ASSESSMENT_QUESTIONS.map((q) => {
          const picked = selectedAnswers[q.id];
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  Question {q.number} of 10 • {q.topic}
                </span>
                {submitted && (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      picked === q.correctIndex
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {picked === q.correctIndex ? '+1 Mark (Correct)' : '0 Marks (Incorrect)'}
                  </span>
                )}
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900">{q.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, idx) => {
                  const isPicked = picked === idx;
                  const isRight = idx === q.correctIndex;
                  let optStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400';

                  if (!submitted && isPicked) {
                    optStyle = 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-500/20';
                  } else if (submitted) {
                    if (isRight) {
                      optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                    } else if (isPicked) {
                      optStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitted}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }))
                      }
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && isRight && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong className="text-slate-900">Solution Explanation: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Assessment Bar */}
      {!submitted && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm">
            You have answered <strong>{answeredCount}</strong> of <strong>10</strong> questions. Submit when ready to generate your topic-wise mastery report!
          </div>
          <button
            type="button"
            onClick={handleSubmitExam}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold shadow-md cursor-pointer shrink-0"
          >
            Submit 10-Question Assessment
          </button>
        </div>
      )}
    </div>
  );
}
