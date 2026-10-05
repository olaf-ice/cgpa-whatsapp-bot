/**
 * University of Ibadan Distance Learning Centre (DLC UI)
 * 2023/2024 Session Course Registration Guidelines & Advisory Engine
 * Based on official DLC UI Registration Guidelines Version 2.0
 */

export interface SemesterGuideline {
  term: 1 | 2;
  compulsoryCourses: string[];
  electiveNotes?: string;
  minUnits?: number;
  maxUnits: number;
}

export interface StreamGuideline {
  level: number;
  stream: 'OLEVEL' | 'DE' | 'FAST_TRACK' | 'RETURNING';
  streamLabel: string;
  semesters: SemesterGuideline[];
}

export interface DepartmentGuidelines {
  department: string;
  faculty: string;
  streams: StreamGuideline[];
  prerequisites?: { [courseCode: string]: string[] }; // courseCode requires [prereq1, prereq2]
  specialNotes?: string[];
}

export const UI_DLC_GUIDELINES: DepartmentGuidelines[] = [
  // 1. COMPUTER SCIENCE (Science)
  {
    department: 'Computer Science',
    faculty: 'Faculty of Science',
    specialNotes: [
      'GES requirement: At least 8 GES courses (admitted 2018/2019+) or 6 GES courses (prior to 2018).',
      'Electives are optional unless needed to fulfill semester minimum credit requirements.'
    ],
    streams: [
      {
        level: 100,
        stream: 'OLEVEL',
        streamLabel: '100L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'CSC 102', 'MAT 111', 'MAT 121', 'PHY 102', 'STA 115'],
            minUnits: 23,
            maxUnits: 23,
            electiveNotes: 'All listed courses are compulsory for 100L 1st semester.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'CSC 103', 'MAT 141', 'PHY 104', 'PHY 105', 'STA 121'],
            minUnits: 20,
            maxUnits: 24,
            electiveNotes: 'Pick external electives if required to meet 20-unit minimum.'
          }
        ]
      },
      {
        level: 200,
        stream: 'RETURNING',
        streamLabel: '200L Returning Students (O\'Level)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 201', 'GES 102', 'CSC 213', 'CSC 231', 'CSC 235', 'CSC 242', 'MAT 213', 'STA 211'],
            minUnits: 24,
            maxUnits: 40,
            electiveNotes: 'Available electives: MAT 241, MAT 251 (not mandatory).'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'CSC 222', 'CSC 236', 'CSC 272', 'CSC 293', 'CSC 299', 'MAT 223', 'STA 221'],
            minUnits: 24,
            maxUnits: 35,
            electiveNotes: 'Available electives: CSC 234, MAT 242 (not mandatory).'
          }
        ]
      },
      {
        level: 200,
        stream: 'DE',
        streamLabel: '200L Direct Entry (1st Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'CSC 213', 'CSC 231', 'CSC 235', 'CSC 242', 'MAT 213', 'STA 211'],
            minUnits: 24,
            maxUnits: 32,
            electiveNotes: 'Available electives: MAT 241, MAT 251.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'CSC 222', 'CSC 236', 'CSC 272', 'CSC 293', 'CSC 299', 'MAT 223', 'STA 221'],
            minUnits: 24,
            maxUnits: 31,
            electiveNotes: 'Available electives: CSC 234, MAT 242.'
          }
        ]
      },
      {
        level: 300,
        stream: 'OLEVEL',
        streamLabel: '300L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 301', 'GES 103', 'GES 106', 'CSC 321', 'CSC 322', 'CSC 331', 'CSC 341', 'CSC 302', 'CSC 351', 'MAT 353', 'MAT 351'],
            minUnits: 30,
            maxUnits: 40,
            electiveNotes: 'Optional elective: MAT 351.'
          },
          {
            term: 2,
            compulsoryCourses: ['CSC 334', 'CSC 335', 'CSC 301', 'CSC 313', 'CSC 399', 'MAT 352'],
            minUnits: 21,
            maxUnits: 32,
            electiveNotes: 'Optional elective: CSC 381.'
          }
        ]
      },
      {
        level: 300,
        stream: 'DE',
        streamLabel: '300L Direct Entry (2nd Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 201', 'GES 102', 'CSC 321', 'CSC 322', 'CSC 331', 'CSC 341', 'CSC 302', 'CSC 351', 'MAT 353', 'MAT 351'],
            minUnits: 28,
            maxUnits: 40,
            electiveNotes: 'Optional elective: MAT 351.'
          },
          {
            term: 2,
            compulsoryCourses: ['CSC 334', 'CSC 335', 'CSC 301', 'CSC 313', 'CSC 399', 'MAT 352'],
            minUnits: 21,
            maxUnits: 32,
            electiveNotes: 'Optional elective: CSC 381.'
          }
        ]
      },
      {
        level: 400,
        stream: 'DE',
        streamLabel: '400L Direct Entry (3rd Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 301', 'GES 103', 'GES 106', 'CSC 412', 'CSC 421', 'CSC 472', 'CSC 431', 'CSC 475', 'CSC 476'],
            minUnits: 25,
            maxUnits: 35
          },
          {
            term: 2,
            compulsoryCourses: ['CSC 499'],
            minUnits: 5,
            maxUnits: 15,
            electiveNotes: 'CSC 499 (Final Year Project).'
          }
        ]
      }
    ]
  },

  // 2. ECONOMICS (Social Sciences)
  {
    department: 'Economics',
    faculty: 'Faculty of Social Sciences',
    streams: [
      {
        level: 100,
        stream: 'OLEVEL',
        streamLabel: '100L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'ECO 101', 'ECO 104'],
            minUnits: 19,
            maxUnits: 25,
            electiveNotes: 'Offer at least 9 units from ANY two departments from External Electives category.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'ECO 102', 'ECO 103'],
            minUnits: 17,
            maxUnits: 23,
            electiveNotes: 'Offer at least 9 units from ANY two departments from External Electives category.'
          }
        ]
      },
      {
        level: 200,
        stream: 'DE',
        streamLabel: '200L Direct Entry (1st Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'ECO 104', 'FSS 204'],
            minUnits: 16,
            maxUnits: 25,
            electiveNotes: 'Offer at least 6 units from ANY of the External Electives / Subsidiary courses across 2 departments.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'ECO 202', 'ECO 203'],
            minUnits: 14,
            maxUnits: 23,
            electiveNotes: 'Offer at least 6 units from ANY External Electives across 2 departments.'
          }
        ]
      },
      {
        level: 200,
        stream: 'RETURNING',
        streamLabel: '200L Returning Students (O\'Level)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 106', 'GES 201', 'FSS 204', 'ECO 201', 'ECO 204'],
            minUnits: 19,
            maxUnits: 25,
            electiveNotes: 'At least ONE departmental elective.'
          },
          {
            term: 2,
            compulsoryCourses: ['ECO 202', 'ECO 203'],
            minUnits: 12,
            maxUnits: 21,
            electiveNotes: 'At least 2 External Electives across at least two departments.'
          }
        ]
      },
      {
        level: 300,
        stream: 'OLEVEL',
        streamLabel: '300L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 301', 'GES 104', 'ECO 301', 'ECO 303', 'ECO 305', 'ECO 311', 'ECO 341'],
            minUnits: 24,
            maxUnits: 30,
            electiveNotes: 'Choose 1 course from Departmental Field Area (ECO 351 or ECO 371).'
          },
          {
            term: 2,
            compulsoryCourses: ['ECO 302', 'ECO 343'],
            minUnits: 12,
            maxUnits: 18,
            electiveNotes: 'Choose 1 field area course (ECO 312, 314, 315, 321, 361, 362) + at least one 300L External Elective.'
          }
        ]
      },
      {
        level: 400,
        stream: 'OLEVEL',
        streamLabel: '400L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 105', 'ECO 401', 'ECO 441'],
            minUnits: 11,
            maxUnits: 23,
            electiveNotes: 'Choose at least 1 course from field area (ECO 414, ECO 451, ECO 461, ECO 471).'
          },
          {
            term: 2,
            compulsoryCourses: ['ECO 402', 'ECO 405'],
            minUnits: 9,
            maxUnits: 24,
            electiveNotes: 'Choose max 1 from field area (ECO 411, ECO 452, ECO 492). ECO 442 optional.'
          }
        ]
      },
      {
        level: 500,
        stream: 'OLEVEL',
        streamLabel: '500L O\'Level / DE Final Year',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['ECO 503', 'ECO 581'],
            minUnits: 15,
            maxUnits: 30,
            electiveNotes: 'At least 1 Field Area course (ECO 414, 451, 461, 471) + 1 External Elective.'
          },
          {
            term: 2,
            compulsoryCourses: [],
            minUnits: 6,
            maxUnits: 18,
            electiveNotes: '1 Departmental Field Area course + 1 External Elective.'
          }
        ]
      }
    ]
  },

  // 3. NURSING (Clinical Sciences)
  {
    department: 'Nursing',
    faculty: 'Faculty of Clinical Sciences',
    specialNotes: [
      'Prerequisite chains are strictly enforced by the faculty before clinical posting or course enrollment.',
      'A prerequisite course must be completed and passed prior to registering the dependent course.'
    ],
    prerequisites: {
      'NSG 223': ['NSG 313', 'NSG 323'],
      'PSM 201': ['NSG 318'],
      'NSG 229': ['NSG 319', 'NSG 323'],
      'NSG 222': ['NSG 315'],
      'NSG 311': ['NSG 321'],
      'NSG 315': ['NSG 325'],
      'NSG 317': ['NSG 327']
    },
    streams: [
      {
        level: 200,
        stream: 'DE',
        streamLabel: '200L Direct Entry (1st Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 102', 'GES 108', 'NSG 212', 'NSG 211', 'NSG 215', 'NSG 231', 'BIC 201', 'PIO 205', 'ANA 213'],
            maxUnits: 30
          },
          {
            term: 2,
            compulsoryCourses: ['NSG 229', 'NSG 222', 'NSG 223', 'NSG 232', 'NSG 225', 'PIO 206', 'ANA 214', 'PSY 205', 'PSM 201', 'NSG 214', 'NSG 216', 'GCE 204'],
            maxUnits: 36
          }
        ]
      },
      {
        level: 300,
        stream: 'DE',
        streamLabel: '300L Direct Entry (2nd Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 106', 'GES 201', 'NSG 311', 'NSG 313', 'NSG 318', 'NSG 319', 'NSG 315', 'NSG 317', 'NSG 331', 'PHA 301', 'MIC 301'],
            minUnits: 36,
            maxUnits: 45
          },
          {
            term: 2,
            compulsoryCourses: ['NSG 322', 'NSG 323', 'NSG 321', 'NSG 325', 'NSG 327', 'NSG 332', 'PIO 207', 'SOC 343', 'GES 107'],
            minUnits: 26,
            maxUnits: 33
          }
        ]
      },
      {
        level: 400,
        stream: 'DE',
        streamLabel: '400L Direct Entry (3rd Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 105', 'GES 108', 'NSG 417', 'NSG 418', 'NSG 412', 'NSG 415', 'NSG 416', 'NSG 414', 'NSG 411', 'NSG 421', 'NSG 413', 'NSG 431'],
            minUnits: 33,
            maxUnits: 45
          },
          {
            term: 2,
            compulsoryCourses: ['NSG 422', 'NSG 424', 'NSG 427', 'NSG 425', 'NSG 432'],
            minUnits: 20,
            maxUnits: 33
          }
        ]
      },
      {
        level: 500,
        stream: 'DE',
        streamLabel: '500L Direct Entry (4th Year DE)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['NSG 518', 'GES 301', 'NSG 512', 'NSG 515', 'NSG 519', 'NSG 531'],
            minUnits: 20,
            maxUnits: 45,
            electiveNotes: 'Special Electives: NSG 521, 526, 523, 524, 531, 530, 520, 537.'
          },
          {
            term: 2,
            compulsoryCourses: ['NSG 529', 'NSG 513', 'NSG 525', 'NSG 532', 'NSG 528', 'NSG 533', 'NSG 522'],
            minUnits: 20,
            maxUnits: 33
          }
        ]
      }
    ]
  },

  // 4. POLITICAL SCIENCE (Social Sciences)
  {
    department: 'Political Science',
    faculty: 'Faculty of Social Sciences',
    streams: [
      {
        level: 100,
        stream: 'OLEVEL',
        streamLabel: '100L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'POS 111', 'POS 113'],
            minUnits: 19,
            maxUnits: 25,
            electiveNotes: 'At least 9 units from External Electives across at least 2 departments.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'POS 112', 'POS 114'],
            minUnits: 17,
            maxUnits: 23,
            electiveNotes: 'At least 9 units from External Electives across at least 2 departments.'
          }
        ]
      },
      {
        level: 200,
        stream: 'RETURNING',
        streamLabel: '200L Returning Students (O\'Level)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 201', 'GES 106', 'FSS 204', 'POS 211', 'POS 213', 'POS 215'],
            minUnits: 19,
            maxUnits: 31,
            electiveNotes: 'At least 3 units from External Electives across 2 departments.'
          },
          {
            term: 2,
            compulsoryCourses: ['POS 212', 'POS 214', 'POS 216'],
            minUnits: 12,
            maxUnits: 21,
            electiveNotes: 'At least 3 units from External Electives across 2 departments.'
          }
        ]
      },
      {
        level: 300,
        stream: 'OLEVEL',
        streamLabel: '300L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 301', 'GES 104', 'POS 311', 'POS 313', 'POS 315', 'POS 321'],
            minUnits: 19,
            maxUnits: 28,
            electiveNotes: 'At least 1 course from External Electives.'
          },
          {
            term: 2,
            compulsoryCourses: ['POS 314', 'POS 316', 'POS 322'],
            minUnits: 15,
            maxUnits: 21,
            electiveNotes: 'At least 1 Departmental Elective (POS 324, 352, 344, 364) + at least 1 External Elective.'
          }
        ]
      }
    ]
  },

  // 5. SOCIOLOGY (Social Sciences)
  {
    department: 'Sociology',
    faculty: 'Faculty of Social Sciences',
    streams: [
      {
        level: 100,
        stream: 'OLEVEL',
        streamLabel: '100L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'SOC 101', 'SOC 102'],
            minUnits: 22,
            maxUnits: 25,
            electiveNotes: 'Minimum of 12 units External Electives from at least 2 different departments.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'SOC 103', 'SOC 104'],
            minUnits: 20,
            maxUnits: 23,
            electiveNotes: 'Minimum of 12 units External Electives from at least 2 different departments.'
          }
        ]
      },
      {
        level: 200,
        stream: 'RETURNING',
        streamLabel: '200L Returning Students (O\'Level)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 105', 'GES 106', 'GES 201', 'SOC 201', 'SOC 205', 'SOC 212', 'FSS 204'],
            minUnits: 27,
            maxUnits: 33,
            electiveNotes: 'Minimum of 9 units External Electives from at least 2 different departments.'
          },
          {
            term: 2,
            compulsoryCourses: ['SOC 206', 'SOC 215'],
            minUnits: 15,
            maxUnits: 21,
            electiveNotes: 'Minimum of 9 units External Electives from at least 2 different departments.'
          }
        ]
      },
      {
        level: 300,
        stream: 'OLEVEL',
        streamLabel: '300L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 104', 'GES 301', 'SOC 301', 'SOC 302', 'SOC 303', 'SOC 306', 'SOC 307', 'SOC 311'],
            minUnits: 22,
            maxUnits: 33,
            electiveNotes: 'No electives in first semester. SOC 302 and 307 are strictly for Sociology majors.'
          },
          {
            term: 2,
            compulsoryCourses: ['SOC 310', 'SOC 314', 'SOC 350'],
            minUnits: 18,
            maxUnits: 27,
            electiveNotes: 'Minimum of 9 units External Electives across at least 2 departments.'
          }
        ]
      }
    ]
  },

  // 6. COMMUNICATION AND LANGUAGE ARTS (CLA - Arts)
  {
    department: 'Communication and Language Arts',
    faculty: 'Faculty of Arts',
    streams: [
      {
        level: 100,
        stream: 'OLEVEL',
        streamLabel: '100L O\'Level',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 101', 'GES 108', 'CLA 101', 'CLA 102', 'CLA 103', 'CLA 106', 'LIN 141', 'ENG 102'],
            minUnits: 21,
            maxUnits: 27,
            electiveNotes: 'Pick either CLA 107 or CLA 108. At least 9 units of External Electives within faculty.'
          },
          {
            term: 2,
            compulsoryCourses: ['GES 107', 'CLA 104', 'CLA 105'],
            minUnits: 6,
            maxUnits: 15,
            electiveNotes: 'External Electives from other departments in faculty.'
          }
        ]
      },
      {
        level: 200,
        stream: 'RETURNING',
        streamLabel: '200L Returning Students (O\'Level)',
        semesters: [
          {
            term: 1,
            compulsoryCourses: ['GES 106', 'GES 201', 'CLA 201', 'CLA 203', 'CLA 207', 'CLA 215', 'LIN 241'],
            minUnits: 15,
            maxUnits: 28,
            electiveNotes: 'At least 4 units Departmental Electives (CLA 206, 208, 210, 211, 212, 214) + at least 7 units External Electives.'
          },
          {
            term: 2,
            compulsoryCourses: ['CLA 204', 'CLA 209'],
            minUnits: 6,
            maxUnits: 20
          }
        ]
      }
    ]
  }
];

/**
 * Searches and retrieves guidelines for a given department and level.
 */
export function findDepartmentGuidelines(departmentName: string): DepartmentGuidelines | undefined {
  if (!departmentName) return undefined;
  const normalized = departmentName.toLowerCase().replace(/[^a-z]/g, '');

  return UI_DLC_GUIDELINES.find(dept => {
    const targetNorm = dept.department.toLowerCase().replace(/[^a-z]/g, '');
    return targetNorm.includes(normalized) || normalized.includes(targetNorm);
  });
}

/**
 * Evaluates a proposed semester registration against the official UI guidelines.
 */
export function evaluateRegistration(params: {
  department: string;
  level: number;
  stream?: 'OLEVEL' | 'DE' | 'FAST_TRACK' | 'RETURNING';
  term: 1 | 2;
  registeredCourses: { code: string; units: number }[];
  carryovers: { code: string; units: number }[];
}) {
  const deptGuide = findDepartmentGuidelines(params.department);
  if (!deptGuide) {
    // Default fallback if department not specifically indexed
    const totalRegUnits = params.registeredCourses.reduce((sum, c) => sum + (Number(c.units) || 0), 0);
    const totalCarryoverUnits = params.carryovers.reduce((sum, c) => sum + (Number(c.units) || 0), 0);
    const combinedUnits = totalRegUnits + totalCarryoverUnits;

    return {
      departmentFound: false,
      totalUnits: combinedUnits,
      minUnits: 15,
      maxUnits: 24,
      isUnderLimit: combinedUnits < 15,
      isOverLimit: combinedUnits > 24,
      remainingUnitCapacity: Math.max(0, 24 - combinedUnits),
      carryoverUnits: totalCarryoverUnits,
      missingCompulsory: [],
      prerequisiteViolations: [],
      notes: ['General University of Ibadan rule: Recommended credit unit load is 15-24 units per semester.']
    };
  }

  // Find stream matching level
  const stream = deptGuide.streams.find(s => s.level === params.level && (!params.stream || s.stream === params.stream)) 
    || deptGuide.streams.find(s => s.level === params.level) 
    || deptGuide.streams[0];

  const semGuide = stream?.semesters.find(s => s.term === params.term) || stream?.semesters[0];

  const minUnits = semGuide?.minUnits || 12;
  const maxUnits = semGuide?.maxUnits || 24;

  const totalRegUnits = params.registeredCourses.reduce((sum, c) => sum + (Number(c.units) || 0), 0);
  const totalCarryoverUnits = params.carryovers.reduce((sum, c) => sum + (Number(c.units) || 0), 0);
  const combinedUnits = totalRegUnits + totalCarryoverUnits;

  // Check missing compulsory courses
  const regCodesNorm = new Set([
    ...params.registeredCourses.map(c => c.code.replace(/\s+/g, '').toUpperCase()),
    ...params.carryovers.map(c => c.code.replace(/\s+/g, '').toUpperCase())
  ]);

  const missingCompulsory: string[] = [];
  if (semGuide?.compulsoryCourses) {
    for (const comp of semGuide.compulsoryCourses) {
      const compNorm = comp.replace(/\s+/g, '').toUpperCase();
      if (!regCodesNorm.has(compNorm)) {
        missingCompulsory.push(comp);
      }
    }
  }

  // Check prerequisite violations
  const prerequisiteViolations: { course: string; requires: string }[] = [];
  if (deptGuide.prerequisites) {
    for (const [course, reqs] of Object.entries(deptGuide.prerequisites)) {
      const courseNorm = course.replace(/\s+/g, '').toUpperCase();
      if (regCodesNorm.has(courseNorm)) {
        // If user is registering a course whose prerequisite is in their failed carryovers list
        for (const req of reqs) {
          const reqNorm = req.replace(/\s+/g, '').toUpperCase();
          const isCarryover = params.carryovers.some(co => co.code.replace(/\s+/g, '').toUpperCase() === reqNorm);
          if (isCarryover) {
            prerequisiteViolations.push({ course, requires: req });
          }
        }
      }
    }
  }

  return {
    departmentFound: true,
    department: deptGuide.department,
    faculty: deptGuide.faculty,
    streamLabel: stream?.streamLabel || `${params.level}L`,
    totalUnits: combinedUnits,
    courseUnits: totalRegUnits,
    carryoverUnits: totalCarryoverUnits,
    minUnits,
    maxUnits,
    isUnderLimit: combinedUnits < minUnits,
    isOverLimit: combinedUnits > maxUnits,
    unitExcess: Math.max(0, combinedUnits - maxUnits),
    remainingUnitCapacity: Math.max(0, maxUnits - combinedUnits),
    missingCompulsory,
    prerequisiteViolations,
    electiveNotes: semGuide?.electiveNotes,
    specialNotes: deptGuide.specialNotes || []
  };
}
